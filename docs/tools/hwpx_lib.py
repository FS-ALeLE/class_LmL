"""HWPX(한글) 양식 편집 도우미.

양식의 서식(글자 모양·문단 모양·표)을 그대로 두고 글자만 바꾸기 위한 함수 모음.
"""
import copy
import re
from lxml import etree

HP = "{http://www.hancom.co.kr/hwpml/2011/paragraph}"
HC = "{http://www.hancom.co.kr/hwpml/2011/core}"


def _inside_nested(el, p):
    a = el.getparent()
    while a is not None and a is not p:
        if a.tag in (HP + "tbl", HP + "subList"):
            return True
        a = a.getparent()
    return False


def own_t(p):
    """문단 p 자신의 글자 요소(hp:t) — 안쪽 표/글상자 글자는 제외."""
    return [t for t in p.iter(HP + "t") if not _inside_nested(t, p)]


def own_text(p):
    return "".join("".join(t.itertext()) for t in own_t(p))


def _drop_lineseg(p):
    for ls in p.findall(HP + "linesegarray"):
        p.remove(ls)


def _write_t(t, text):
    for c in list(t):
        t.remove(c)
    parts = text.split("\n")
    t.text = parts[0]
    for part in parts[1:]:
        lb = etree.SubElement(t, HP + "lineBreak")
        lb.tail = part


def set_text(p, text):
    """문단 글자를 바꾼다. 앞쪽의 공백뿐인 글자 조각(아이콘 뒤 간격)은 유지하고,
    처음 나오는 글자 조각의 앞 공백도 유지한다. 나머지 조각은 비운다."""
    ts = own_t(p)
    _drop_lineseg(p)
    if not ts:
        runs = p.findall(HP + "run")
        run = runs[-1] if runs else etree.SubElement(p, HP + "run", charPrIDRef="0")
        t = etree.SubElement(run, HP + "t")
        _write_t(t, text)
        return p
    idx = next((i for i, t in enumerate(ts) if "".join(t.itertext()).strip()), len(ts) - 1)
    orig = "".join(ts[idx].itertext())
    lead = orig[: len(orig) - len(orig.lstrip())]
    _write_t(ts[idx], lead + text.lstrip())
    for t in ts[idx + 1:]:
        _write_t(t, "")
    return p


def set_runs(p, texts):
    """글자 조각마다 따로 글자를 넣는다(체크박스 줄처럼 조각별 서식이 다른 경우)."""
    ts = own_t(p)
    _drop_lineseg(p)
    for i, t in enumerate(ts):
        _write_t(t, texts[i] if i < len(texts) else "")
    return p


def set_segments(p, segs, normal_cp="28", answer_cp="122"):
    """[(글자, 'n'|'a'), ...] — 'a'는 파란 예시답안 글자. 문단의 글자 run을 새로 만든다."""
    _drop_lineseg(p)
    runs = [r for r in p.findall(HP + "run") if r.find(HP + "t") is not None or len(r) == 0]
    base = runs[0] if runs else None
    insert_at = list(p).index(base) if base is not None else len(p)
    for r in runs:
        p.remove(r)
    for k, (text, kind) in enumerate(segs):
        r = etree.Element(HP + "run", charPrIDRef=answer_cp if kind == "a" else normal_cp)
        t = etree.SubElement(r, HP + "t")
        _write_t(t, text)
        p.insert(insert_at + k, r)
    return p


def paragraphs(root):
    return list(root.iter(HP + "p"))


def find(root, text, starts=False, contains=False):
    out = []
    for p in root.iter(HP + "p"):
        s = own_text(p).strip()
        if (contains and text in s) or (starts and s.startswith(text)) or (not starts and not contains and s == text.strip()):
            out.append(p)
    return out


def rep(root, old, new, starts=False, contains=False, idx=None, expect=None):
    ps = find(root, old, starts=starts, contains=contains)
    if expect is not None and len(ps) != expect:
        raise ValueError(f"'{old}' 찾은 개수 {len(ps)} != {expect}")
    if not ps:
        raise ValueError(f"찾지 못함: {old}")
    targets = ps if idx is None else [ps[idx]]
    for p in targets:
        set_text(p, new)
    return targets


def top_paragraphs(root):
    return root.findall(HP + "p")


def tables(el):
    return list(el.iter(HP + "tbl"))


def table_with(root, first_text):
    """첫 칸 글자가 first_text인 표."""
    for tbl in root.iter(HP + "tbl"):
        c = cell(tbl, 0, 0)
        if c is not None and own_text_cell(c).strip().startswith(first_text):
            return tbl
    raise ValueError("표를 찾지 못함: " + first_text)


def cell(tbl, r, c):
    for tr in tbl.findall(HP + "tr"):
        for tc in tr.findall(HP + "tc"):
            a = tc.find(HP + "cellAddr")
            if a.get("rowAddr") == str(r) and a.get("colAddr") == str(c):
                return tc
    return None


def cell_pars(tc):
    return tc.find(HP + "subList").findall(HP + "p")


def own_text_cell(tc):
    return " ".join(own_text(p) for p in cell_pars(tc))


def set_cell(tc, lines):
    """셀의 문단을 lines 개수에 맞춰 (마지막 문단 복제/삭제) 글자를 넣는다."""
    sub = tc.find(HP + "subList")
    ps = sub.findall(HP + "p")
    while len(ps) < len(lines):
        n = copy.deepcopy(ps[-1])
        ps[-1].addnext(n)
        ps.append(n)
    for p in ps[len(lines):]:
        sub.remove(p)
    for p, line in zip(ps, lines):
        if isinstance(line, list):
            set_segments(p, line)
        else:
            set_text(p, line)


def rebuild(container, items):
    """container(subList) 안의 문단을 items로 갈아끼운다.
    items: [(template_p, text|None|segments)] — template은 원본 문단(깊은 복사해서 씀)."""
    if container.tag == HP + "tc":
        container = container.find(HP + "subList")
    templates = [copy.deepcopy(t) for t, _ in items]
    for p in container.findall(HP + "p"):
        container.remove(p)
    for tp, (_, text) in zip(templates, items):
        if isinstance(text, list):
            set_segments(tp, text)
        elif text is not None:
            set_text(tp, text)
        else:
            _drop_lineseg(tp)
        container.append(tp)


def remove_rows(tbl, rows):
    rows = set(rows)
    trs = tbl.findall(HP + "tr")
    keep = []
    for i, tr in enumerate(trs):
        if i in rows:
            tbl.remove(tr)
        else:
            keep.append(tr)
    for new_r, tr in enumerate(keep):
        for tc in tr.findall(HP + "tc"):
            tc.find(HP + "cellAddr").set("rowAddr", str(new_r))
    tbl.set("rowCnt", str(len(keep)))


_id = [1900000000]


def new_pic_like(pic, bin_id, px_w, px_h, disp_w):
    """기존 그림 요소를 복제해 다른 이미지(bin_id)를 표시. disp_w: 표시 너비(HWPUNIT)."""
    n = copy.deepcopy(pic)
    org_w, org_h = px_w * 75, px_h * 75
    disp_h = int(disp_w * px_h / px_w)
    _id[0] += 1
    n.set("id", str(_id[0]))
    n.set("instid", str(_id[0] - 1000000000))
    n.find(HP + "offset").attrib.update(dict(x="0", y="0"))
    n.find(HP + "orgSz").attrib.update(dict(width=str(org_w), height=str(org_h)))
    n.find(HP + "curSz").attrib.update(dict(width=str(disp_w), height=str(disp_h)))
    n.find(HP + "rotationInfo").attrib.update(dict(centerX=str(disp_w // 2), centerY=str(disp_h // 2)))
    ri = n.find(HP + "renderingInfo")
    ri.find(HC + "transMatrix").attrib.update(dict(e3="0", e6="0"))
    ri.find(HC + "scaMatrix").attrib.update(dict(e1=f"{disp_w / org_w:.6f}", e3="0", e5=f"{disp_h / org_h:.6f}", e6="0"))
    n.find(HC + "img").set("binaryItemIDRef", bin_id)
    ir = n.find(HP + "imgRect")
    ir.find(HC + "pt1").attrib.update(dict(x=str(org_w), y="0"))
    ir.find(HC + "pt2").attrib.update(dict(x=str(org_w), y=str(org_h)))
    ir.find(HC + "pt3").attrib.update(dict(x="0", y=str(org_h)))
    n.find(HP + "imgClip").attrib.update(dict(left="0", right=str(org_w), top="0", bottom=str(org_h)))
    n.find(HP + "imgDim").attrib.update(dict(dimwidth=str(org_w), dimheight=str(org_h)))
    n.find(HP + "sz").attrib.update(dict(width=str(disp_w), height=str(disp_h)))
    sc = n.find(HP + "shapeComment")
    if sc is not None:
        sc.text = "그림입니다."
    return n
