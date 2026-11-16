"""수업안 양식(hwpx)에 들이 공개수업 내용을 채워 새 hwpx를 만든다.

사용법 (저장소 루트에서):
    python3 docs/tools/build_lesson_plan.py

입력: docs/양식_참고/수업안_양식(2-2_국어예시).hwpx, docs/tools/img/*.png
출력: docs/수업안_들이_공개수업.hwpx
"""
import copy
import os
import sys
import zipfile
from lxml import etree

sys.path.insert(0, os.path.dirname(__file__))
from hwpx_lib import (HP, HC, own_text, set_text, set_runs, set_segments, find, rep,
                      top_paragraphs, cell, cell_pars, set_cell, rebuild, remove_rows, new_pic_like)

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SRC = os.path.join(ROOT, "docs", "양식_참고", "수업안_양식(2-2_국어예시).hwpx")
OUT = os.path.join(ROOT, "docs", "수업안_들이_공개수업.hwpx")
IMG = os.path.join(ROOT, "docs", "tools", "img")
URL = "https://classlml.vercel.app"

zin = zipfile.ZipFile(SRC)
sec = etree.fromstring(zin.read("Contents/section0.xml"))
tops = top_paragraphs(sec)


def tbl_by(pred, scope=sec):
    for t in scope.iter(HP + "tbl"):
        if pred(t):
            return t
    raise ValueError("table not found")


def txt(tbl, r, c):
    tc = cell(tbl, r, c)
    return "" if tc is None else " ".join(own_text(p) for p in cell_pars(tc)).strip()


# 그림 복제용 원본(도움자료 표 안의 그림) — 수정 전에 미리 복사
pic_template = None
for pic in sec.iter(HP + "pic"):
    if pic.find(".//" + HC + "img").get("binaryItemIDRef") == "image15":
        pic_template = copy.deepcopy(pic)
        break

# ───────────────────────── 표지 ─────────────────────────
rep(sec, "☑ 기초 / ☐ 기본 / ☐ 심화", "☐ 기초 / ☑ 기본 / ☐ 심화")
rep(sec, "비판적･창의적 사고", "추론·의사소통")
rep(sec, "온책 읽기로 작품 속", "스토리 게임으로 탐구하는 ")
rep(sec, "인물의 가치관을 탐구해요", "들이의 단위 L와 mL")
# 표지 충남교육 핵심역량 체크
for old, new in [("☐ 지식정보처리", "☑ 지식정보처리"), ("☐ 창의적 사고", "☑ 창의적 사고"), ("☐ 협력적 소통", "☑ 협력적 소통")]:
    for p in find(sec, old, starts=True):
        set_text(p, own_text(p).replace(old, new))

# ───────────────────────── 기본 표 ─────────────────────────
rep(sec, "초등학교 4학년", "초등학교 3학년")
set_runs(find(sec, "☑ 국어  ☐ 수학", starts=True)[0], ["☐ ", "국어  ", "☑ ", "수학  ", "☐ ", "사회  ", "☐ ", "과학  ", "☐ ", "영어"])
rep(sec, "2차시(80분)", "1차시(40분) ※ 재구성 3차시 중 2차시(본시)")
rep(sec, "작품 속 인물의 선택과 가치관을 탐구하고, 자신의 의견이 드러나게 글쓰기",
    "들이와 무게 ─ 들이의 단위 L와 mL를 알고, 들이를 쓰고 읽으며 재기")
rep(sec, "[4국03-03]", "[4수03-○○] 들이를 비교하는 활동을 통하여 들이 단위의 필요성을 인식하고, 1 L와 1 mL의 단위를 알며, 이를 이용하여 들이를 측정할 수 있다.", starts=True)
set_runs(find(sec, "☑ 문학", starts=True)[0], ["☐ ", "수와 연산  ", "☐ ", "변화와 관계  ", "☑ ", "도형과 측정  ", "☐ ", "자료와 가능성"])
set_runs(find(sec, "☑ 비판적·창의적 사고")[0], ["☐", " 문제해결"])
set_runs(find(sec, "☐ 디지털·매체", starts=True)[0], ["☑ ", "추론"])
set_runs(find(sec, "☑ 의사소통")[0], ["☑", " 의사소통"])
set_runs(find(sec, "☑ 공동체·대인관계", starts=True)[0], ["☑ ", "연결"])
set_runs(find(sec, "☐ 문화 향유", starts=True)[0], ["☑ ", "정보처리"])
basic = tbl_by(lambda t: txt(t, 0, 0) == "학년")
set_runs(cell_pars(cell(basic, 7, 3))[0], ["", ""])
rep(sec, "활동지, 영상 자료, 모듬별 토론판", "태블릿(2인 1대), 들이 수업 웹앱(교사 진행판·학생 화면), 활동지 2종, 1 L·200 mL 우유갑")

# ───────────────────────── Ⅰ 교육과정 분석 ─────────────────────────
rep(sec, "〔온책 읽기〕 작품 속 인물의 가치관을 탐구해요", "〔게이미피케이션〕 스토리 게임으로 탐구하는 들이의 단위")
rep(sec, "국어", "수학")  # 학습목표 표 + Ⅲ 기본 정보
goal = tbl_by(lambda t: txt(t, 0, 1) == "지식이해")
set_cell(cell(goal, 0, 2), ["들이의 단위 L와 mL를 알고, 1 L = 1000 mL임을 이해한다."])
set_cell(cell(goal, 1, 2), ["임의 단위로 잰 결과를 비교하여 단위의 필요성을 추론하고, 들이를 ‘□ L □ mL’와 ‘□ mL’로 쓰고 읽으며 눈금을 읽어 들이를 잴 수 있다."])
set_cell(cell(goal, 2, 2), ["모둠 친구와 협력하여 미션을 해결하고, 생활 속에서 들이의 단위를 바르게 사용하려는 태도를 가진다."])

guide = tbl_by(lambda t: txt(t, 0, 0) == "수업 의도")
set_cell(cell(guide, 0, 1), [
    "본 수업은 ‘들이를 비교해 볼까요’, ‘들이의 단위를 알아볼까요’, ‘들이를 어림하고 재어 볼까요’ 세 차시를 재구성한 것이다. "
    "사막의 여섯 마을이 마법 항아리의 물을 나누어 쓰는 이야기 속에서, 학생들은 마을마다 크기가 다른 컵(임의 단위)으로 같은 항아리를 재며 "
    "결과가 서로 달라지는 인지 갈등을 경험하고, 이를 해결하기 위해 보편 단위 L와 mL를 스스로 필요로 하게 된다. "
    "교사가 단계를 넘기면 학생 태블릿 화면이 함께 전환되는 실시간 웹앱을 활용하여 미션·각인·별·평화의 다리 같은 게이미피케이션 요소로 몰입을 높였고, "
    "물을 직접 다루는 대신 옮겨 담기·눈금 읽기 시뮬레이션으로 측정의 원리에 집중하도록 설계하였다. "
    "또한 도우미 모드(글자 확대, 선택형 문항, 소리 읽기)를 두어 특수교육대상 학생도 같은 이야기 속에서 함께 참여하도록 하였다."])
set_cell(cell(guide, 1, 1), [
    "[활동1] 물 거래 대소동: 마을 컵(임의 단위)으로 마법 항아리를 재고 결과를 비교하여 단위의 필요성 찾기",
    "[활동2] 단위의 탄생: L·mL 쓰고 읽기, 1 L = 1000 mL 알기, 들이를 바꾸어 나타내기",
    "[활동3] 평화의 눈금: 눈금을 읽어 들이를 재고 마법 항아리의 들이(1 L 200 mL) 밝히기"])
set_cell(cell(guide, 2, 1), [
    "학생들은 같은 항아리를 잰 결과가 마을마다 다른 까닭을 추론하며 정보를 비교·분석하는 ‘지식정보처리 역량’과, "
    "보편 단위라는 해결책을 스스로 떠올리는 ‘창의적 사고 역량’을 기를 수 있다. 또한 2인 1대 태블릿으로 짝과 상의하며 미션을 해결하고, "
    "여섯 마을의 결과를 모아 평화의 다리를 함께 완성하는 과정에서 서로 돕고 소통하는 ‘협력적 소통 역량’을 자연스럽게 실천할 수 있다."])

rep(sec, "온책 읽기 수업 안내", "게이미피케이션 수업 안내", contains=True)
rep(sec, "읽기 전", "갈등")
rep(sec, "읽기 중", "발견")
rep(sec, "읽기 후", "적용")
rep(sec, "표지·제목으로 내용 추측 및 읽기 목적 설정", "다른 컵으로 같은 항아리를 재며 단위의 필요성 느끼기")
rep(sec, "인물의 인상적인 말과 행동 파악 및 독서 활동 진행", "L·mL 쓰고 읽기, 1 L = 1000 mL 알기")
rep(sec, "생각 나누기, 토론, 글쓰기를 통해 인상 깊은 내용 내면화", "눈금으로 항아리의 들이를 재고 다리 완성하기")

flow = tbl_by(lambda t: txt(t, 0, 0) == "차시" and txt(t, 0, 1) == "활동 내용")
rows = [
    (["1차시"], ["들이를 직접 맞대어 보거나 옮겨 담아 비교하기", "‘키 큰 그릇이 더 많이 들어갈까?’ 옮겨 담기 퍼즐 해결하기"], ["창의적 사고"]),
    (["2차시", "(본시)"], ["마을 컵(임의 단위)으로 잰 결과를 비교하여 단위의 필요성 알기", "L·mL 쓰고 읽기, 1 L = 1000 mL 알고 눈금으로 들이 재기"], ["지식정보처리", "협력적 소통"]),
    (["3차시"], ["들이를 ‘□ L □ mL’와 ‘□ mL’로 바꾸어 나타내기", "‘우리 집 들이 탐정’ 과제로 생활 속 물건의 들이 어림하기"], ["지식정보처리", "자기관리"]),
    (["4차시"], ["들이의 덧셈과 뺄셈하기 (단원 계획)", "받아올림·받아내림이 있는 들이 계산하기"], ["창의적 사고"]),
]
for i, (a, b, c) in enumerate(rows, start=1):
    set_cell(cell(flow, i, 0), a)
    set_cell(cell(flow, i, 1), b)
    set_cell(cell(flow, i, 2), c)
remove_rows(flow, [5, 6])

main_flow = tbl_by(lambda t: txt(t, 0, 0) == "단계" and txt(t, 0, 1) == "시간")
for i, (stage, time, act) in enumerate([
    ("도입", "5‘", "이야기 ‘여섯 마을 물 거래 대소동’ 듣고 학습 문제 확인"),
    ("전개1", "10‘", "[활동 1] 물 거래 대소동: 마을 컵으로 마법 항아리 재기"),
    ("전개2", "10‘", "[활동 2] 단위의 탄생: L·mL 쓰고 읽기, 1 L = 1000 mL"),
    ("전개3", "10‘", "[활동 3] 평화의 눈금: 눈금 읽고 마법 항아리의 들이 재기"),
    ("정리", "5‘", "평화의 다리 완성, 스스로 평가, 과제 ‘우리 집 들이 탐정’ 안내"),
], start=1):
    set_cell(cell(main_flow, i, 0), [stage])
    set_cell(cell(main_flow, i, 1), [time])
    set_cell(cell(main_flow, i, 2), [act])

plan = tbl_by(lambda t: txt(t, 0, 0) == "평가 목표")
set_cell(cell(plan, 1, 0), ["들이의 단위 L와 mL를 알고, 들이를 바르게 쓰고 읽으며 눈금을 읽어 잴 수 있다."])
set_cell(cell(plan, 1, 1), ["측정"])
set_cell(cell(plan, 1, 2), ["단위의 필요성 설명, L·mL 쓰기와 읽기, 1 L = 1000 mL를 이용한 단위 바꾸기, 눈금 읽기"])
set_cell(cell(plan, 1, 3), ["관찰평가, 웹앱 수행 기록, 활동지 평가"])

rub = tbl_by(lambda t: txt(t, 0, 0) == "구분" and txt(t, 0, 1) == "평가 기준")
set_cell(cell(rub, 2, 0), ["측정"])
set_cell(cell(rub, 2, 1), ["임의 단위로 잰 결과가 다른 까닭을 설명하여 단위의 필요성을 말할 수 있고, 들이를 L·mL로 바르게 쓰고 읽으며 ‘□ L □ mL’와 ‘□ mL’를 자유롭게 바꾸어 나타내고 눈금을 정확히 읽을 수 있다."])
set_cell(cell(rub, 2, 2), ["들이의 단위 L와 mL를 쓰고 읽을 수 있고, 1 L = 1000 mL임을 알며, 도움을 받아 단위를 바꾸거나 눈금을 읽을 수 있다."])
set_cell(cell(rub, 2, 3), ["L와 mL를 구별하여 읽을 수 있으나, 단위를 바꾸어 나타내거나 눈금을 읽는 데 어려움이 있다."])
set_cell(cell(rub, 2, 4), ["관찰평가 / 활동지·웹앱 기록"])

rep(sec, "온책 읽기 활동", "게임 활동")
rec = tbl_by(lambda t: "출발점 진단" in txt(t, 0, 0) or any("출발점 진단" in own_text(p) for p in t.iter(HP + "p")))
set_cell(cell(rec, 1, 0), [
    "  마을마다 크기가 다른 컵으로 같은 항아리를 잰 결과가 서로 다른 까닭을 ‘컵의 크기가 달라서’라고 설명하며, 누구나 똑같이 쓰는 단위가 필요함을 추론함. "
    "1 L와 1 mL를 바르게 쓰고 읽으며, 1 L = 1000 mL임을 이용하여 1 L 300 mL를 1300 mL로 바꾸어 나타냄. "
    "눈금 읽기 활동에서 작은 눈금 한 칸의 크기를 먼저 확인하는 전략으로 계량컵의 물의 양을 정확히 읽고, 같은 마을 친구에게 읽는 방법을 설명함."])

# ───────────────────────── Ⅱ 수업 전 알아보기 ─────────────────────────
rep(sec, "온책 읽기(학습 독서)", "게이미피케이션(Gamification)")
rep(sec, "교과서의 발췌형 지문에서 벗어나", " 게임의 요소(이야기, 미션, 보상, 즉각적인 피드백)를 수업에 적용하여 학습자의 몰입과 참여를 높이는 교수·학습 방법", contains=True)
rep(sec, "학자 및 연구자들의 관점에 따라 온책 읽기는 여러 가지로 정의됨", " 게임 자체를 하는 것이 아니라, 학습 목표에 이르는 과정을 게임처럼 설계하는 것", contains=True)
rep(sec, "책 한 권을 온전히 다 읽으며 작품의 세계를 넓고 깊게 경험하는 활동", " - 학습 내용이 이야기의 문제 상황과 해결 과정 속에 자연스럽게 녹아들도록 구성하는 활동", contains=True)
rep(sec, "을 바탕으로 토론, 글쓰기 등 표현 활동과 연결하여", " - 미션 해결과 보상, 친구와의 협력을 통해 스스로 탐구하고 배움을 확인하는 수업 등", contains=True)
rep(sec, "온책 읽기의 3가지 영역", " 본 수업의 게이미피케이션 3가지 요소", contains=True)
for old, new in [("작품 이해하기", "이야기"), ("(읽기 전·중)", "(몰입)"), ("배경지식 형성 및 내용 파악", "여섯 마을의 갈등과 평화의 다리"),
                 ("인물 공감하기", "미션과 보상"), ("(읽는 중)", "(동기)"), ("인물의 선택과 마음에 공감", "미션 지도, 각인, 별, 다리 조각"),
                 ("생각 내면화하기", "실시간 피드백"), ("(읽은 후)", "(확인)"), ("토론 및 주장하는 글 쓰기", "즉각 정오 피드백, 결과판 공유")]:
    rep(sec, old, new)
rep(sec, "출처: 2022 개정 초등학교 국어과 교육과정", "※ 출처: Kapp, K. M.(2012), The Gamification of Learning and Instruction", contains=True)
rep(sec, "온책 읽기 4가지 단계", "게임형 측정 수업의 3단계")
for old, new in [("주요 활동 내용", "주요 활동 내용"), ("1단계 (읽기 전)", "1단계 (갈등)"), ("표지 및 제목 추론", "임의 단위로 재기"), ("동기 유발, 질문 만들기", "마을 컵으로 재고 결과 비교"),
                 ("2단계 (읽는 중)", "2단계 (발견)"), ("내용 파악 및 갈등 분석", "보편 단위 도입"), ("인물의 선택 까닭 탐구", "L·mL, 1 L = 1000 mL"),
                 ("3단계 (읽은 후)", "3단계 (적용)"), ("찬반 토론 및 주장 쓰기", "눈금으로 재기"), ("근거를 들어 의견 표현", "마법 항아리 들이 측정")]:
    rep(sec, old, new)
rep(sec, "※ 출처: 초등학교 온책 읽기 교수·학습 전략 연구", "※ 출처: 2022 개정 수학과 교육과정을 바탕으로 교사 재구성")

# ───────────────────────── Ⅲ 수업 살펴보기 ─────────────────────────
info = tbl_by(lambda t: txt(t, 0, 0) == "학교급")
set_cell(cell(info, 0, 10), ["추론·의사소통 역량"])
set_cell(cell(info, 1, 5), ["40분"])
set_cell(cell(info, 1, 10), ["스토리 게임 웹앱"])
set_cell(cell(info, 2, 1), ["들이의 단위 L와 mL를 알고, 들이를 쓰고 읽으며 눈금을 읽어 재기"])
set_cell(cell(info, 3, 1), ["태블릿(2인 1대), 들이 수업 웹앱(교사 진행판·학생 화면), 활동지 2종"])
for c, mark in [(1, ""), (2, "○"), (4, "○"), (6, ""), (8, "○"), (9, ""), (11, "")]:
    set_cell(cell(info, 5, c), [mark])

tl = tbl_by(lambda t: txt(t, 0, 1) == "수업 활동")
c_in, c_in_s = cell(tl, 1, 1), cell(tl, 1, 2)
c_dev, c_dev_s = cell(tl, 3, 1), cell(tl, 3, 2)
c_end, c_end_s = cell(tl, 4, 1), cell(tl, 4, 2)
I = cell_pars(c_in)
H1, H2, Q, A, SC, BL = I[0], I[1], I[2], I[3], I[6], I[7]
GOALH, GOALH2, GOALBOX, GUIDEH, GUIDEH2, GUIDEBOX = I[8], I[9], I[10], I[11], I[12], I[13]
D = cell_pars(c_dev)
ACT, DH1, DH2, DQ, DA, DSC, DBL, NOTE = D[0], D[1], D[2], D[3], D[4], D[10], D[11], D[28]
DS = cell_pars(c_dev_s)
SREF, SNOTE, SBL = DS[0], DS[1], DS[2]
E = cell_pars(c_end)
EH1, EH2, EQ, EA, EBL, EH1b, EH2b, EQb = E[0], E[1], E[3], E[4], E[5], E[6], E[7], E[8]
ES = cell_pars(c_end_s)

# 학습 문제·활동 안내 상자 글자
# (글상자는 호환용 사본이 함께 들어 있어 모든 사본을 바꾼다)
for p in GOALBOX.iter(HP + "p"):
    if p is not GOALBOX:
        set_text(p, "들이의 단위 L와 mL를 알고, 들이를 바르게 쓰고 읽어 봅시다.")
guide_lines = ["[활동1] 물 거래 대소동: 마을 컵으로 마법 항아리 재기",
               "[활동2] 단위의 탄생: L·mL 쓰고 읽기, 1 L = 1000 mL",
               "[활동3] 평화의 눈금: 눈금을 읽어 들이 재기"]
for i, p in enumerate([p for p in GUIDEBOX.iter(HP + "p") if p is not GUIDEBOX]):
    set_text(p, guide_lines[i % 3])

rebuild(c_in, [
    (H1, "동기 유발(5‘)"),
    (H2, "이야기 ‘여섯 마을 물 거래 대소동’ 듣기"),
    (Q, "- (교사 진행판의 이야기 화면을 보며) 사막의 여섯 마을에 어떤 일이 생겼나요?"),
    (A, "(마법 항아리에 물이 얼마나 들어가는지 마을마다 말이 달라서 다투고 있습니다.)"),
    (Q, "- 항아리에 물이 얼마나 들어가는지 알려면 어떻게 하면 좋을까요?"),
    (A, "(컵으로 물을 부어서 몇 컵인지 세어 봅니다. / 다른 그릇에 옮겨 담아 봅니다.)"),
    (SC, None), (BL, ""),
    (GOALH, None), (GOALH2, None), (GOALBOX, None),
    (GUIDEH, None), (GUIDEH2, None), (GUIDEBOX, None),
])
rebuild(c_in_s, [
    (SREF, "☞ 교사 진행판(전자칠판), 학생 화면(태블릿 2인 1대), 방 코드·QR 코드"),
    (SREF, f"   ({URL}/teacher)"),
    (SNOTE, "※ 학생은 방 코드로 들어와 마을(모둠)과 태블릿 번호를 고르며, 교사가 [다음]을 누르면 모든 태블릿 화면이 함께 넘어간다."),
    (SNOTE, "※ 특수교육대상 학생은 ‘도우미 모드’(글자 확대, 고르기 문항, 소리 읽기)로 들어오도록 미리 준비한다."),
])

rebuild(c_dev, [
    (ACT, "[활동1] 물 거래 대소동(10‘)"),
    (DH1, "마을 컵(임의 단위)으로 마법 항아리 재기"),
    (DH2, "우리 마을 컵으로 물을 부어 항아리 가득 채우기"),
    (DQ, "- 우리 마을 컵으로 마법 항아리를 가득 채우려면 몇 컵이 필요한지 세어 봅시다."),
    (DA, "(해바라기 마을은 6컵, 조개 마을은 12컵이 들어갔습니다.)"),
    (DH2, "여섯 마을의 결과 비교하기"),
    (DQ, "- 같은 항아리인데 왜 마을마다 결과가 다를까요?"),
    (DA, "(마을마다 컵의 크기가 다르기 때문입니다. / 큰 컵은 조금, 작은 컵은 많이 들어갑니다.)"),
    (DQ, "- 마을 사이의 다툼을 없애려면 무엇이 필요할까요?"),
    (DA, "(모든 마을이 똑같은 컵으로 재야 합니다. / 누구나 똑같이 쓰는 단위가 필요합니다.)"),
    (DSC, None), (DBL, ""),
    (ACT, "[활동2] 단위의 탄생(10‘)"),
    (DH1, "들이의 단위 L와 mL 알아보기"),
    (DH2, "‘L 각인’, ‘mL 각인’ 미션으로 단위 쓰고 읽기"),
    (DQ, "- 1 L는 ‘1 리터’, 1 mL는 ‘1 밀리리터’라고 읽어요. 손가락으로 L와 mL를 따라 써 봅시다."),
    (DA, "(L, mL를 따라 쓰고 ‘3 L’는 3 리터, ‘500 mL’는 500 밀리리터라고 읽습니다.)"),
    (DH2, "‘천 개의 물방울’ 미션으로 1 L와 1 mL의 관계 알기"),
    (DQ, "- 100 mL 컵으로 1 L 그릇을 가득 채우려면 몇 번 부어야 하나요? 1 L는 몇 mL일까요?"),
    (DA, "(10번 부어야 합니다. 1 L는 1000 mL입니다.)"),
    (DH2, "‘마을 장부’ 미션으로 들이를 바꾸어 나타내고 읽기"),
    (DQ, "- 1 L 300 mL는 몇 mL일까요? 어떻게 읽을까요?"),
    (DA, "(1 L는 1000 mL이므로 1300 mL입니다. 1 리터 300 밀리리터라고 읽습니다.)"),
    (DSC, None), (DBL, ""),
    (ACT, "[활동3] 평화의 눈금(10‘)"),
    (DH1, "눈금을 읽어 들이 재기"),
    (DH2, "단계별 눈금 퀴즈 해결하기"),
    (DQ, "- 숫자가 쓰여 있지 않은 작은 눈금 한 칸은 몇 mL를 나타낼까요?"),
    (DA, "(작은 눈금 10칸이 1 L이므로 한 칸은 100 mL입니다.)"),
    (DH2, "마법 항아리의 들이를 재고 평화의 다리 완성하기"),
    (DQ, "- 항아리의 물을 큰 계량컵에 부었더니 1 L를 지나 작은 눈금 2칸만큼 더 올라갔어요. 들이를 두 가지 방법으로 나타내 볼까요?"),
    (DA, "(1 L 200 mL입니다. 1200 mL라고도 나타낼 수 있습니다.)"),
    (DQ, "- 단위로 재니까 마을마다 결과가 어떻게 되었나요?"),
    (DA, "(여섯 마을의 결과가 모두 1 L 200 mL로 같아졌습니다.)"),
    (DSC, None),
    (NOTE, "(활동지 ①, ②에 활동 결과를 정리한다.)"),
])
blank = (SBL, "")
rebuild(c_dev_s, [
    (SREF, "☞ 웹앱 [활동1] 물 거래 대소동, 활동지 ①"),
    (SNOTE, "※ 마을마다 컵의 들이(100~400 mL)를 다르게 정해 두어, 같은 항아리라도 결과가 다르게 나오는 인지 갈등을 경험하게 한다."),
    (SNOTE, "※ 결과가 모두 모이면 진행판의 [마을 컵 나란히 놓기]로 컵의 크기를 비교하여 단위의 필요성을 스스로 발견하게 한다."),
    blank, blank, blank, blank, blank, blank, blank,
    (SREF, "☞ 웹앱 [활동2] 단위의 탄생, 활동지 ①"),
    (SNOTE, "※ L는 대문자로 쓰고, 수와 단위 사이를 띄어 쓰도록 지도한다."),
    (SNOTE, "※ 진행판의 태블릿별 진행 현황을 보며 어려움을 겪는 짝을 찾아 순회 지도한다."),
    blank, blank, blank, blank, blank, blank, blank,
    (SREF, "☞ 웹앱 [활동3] 평화의 눈금, 활동지 ②"),
    (SNOTE, "※ 눈금을 읽기 전에 작은 눈금 한 칸의 크기를 먼저 확인하는 전략을 안내한다."),
    (SNOTE, "※ mL 칸에 1000 이상의 수를 쓰는 오류는 앱이 바로 알려 주므로, 교사는 자주 나온 오류를 모아 전체 피드백에 활용한다."),
])
rebuild(c_end, [
    (EH1, "평화의 다리 완성 및 정리(5‘)"),
    (EH2, "배운 내용 정리하고 스스로 평가하기"),
    (EQ, "- 오늘 들이의 단위에 대해 무엇을 알게 되었나요?"),
    (EA, "(들이의 단위에는 L와 mL가 있고, 1 L는 1000 mL라는 것을 알았습니다. / 단위를 쓰면 누가 재어도 똑같이 말할 수 있습니다.)"),
    (EQ, "- 태블릿 화면의 ‘스스로 평가해 봐요’에 표시해 봅시다."),
    (EBL, ""),
    (EH1b, "차시 예고하기"),
    (EH2b, "과제 안내 및 다음 차시 알아보기"),
    (EQb, "- 집에 있는 물건 3개의 들이를 라벨에서 찾아 적어 오세요. 다음 시간에는 생활 속 물건의 들이를 어림하고 단위를 바꾸어 나타내 봅시다."),
])
rebuild(c_end_s, [
    (ES[0], ""),
    (ES[1], "※ 진행판에 모인 학생 자기평가 결과를 확인하여 다음 차시 지도에 반영한다."),
    (ES[1], "※ 과제 ‘우리 집 들이 탐정’은 3차시 어림하기 활동의 자료로 활용한다."),
])

# ───────────────────────── Ⅳ 도움자료 ─────────────────────────
aid = tbl_by(lambda t: txt(t, 0, 0) == "자료" and "도움자료" in txt(t, 0, 3))
set_cell(cell(aid, 1, 1), ["2차시", "(수학)"])
set_cell(cell(aid, 1, 2), ["전개", "(활동1~3)"])
ap = cell_pars(cell(aid, 1, 3))
set_text(ap[0], "들이 수업 웹앱 「여섯 마을 물 거래 대소동」 (학생 화면·교사 진행판)")
set_runs(ap[1], [" 주소: ", f"{URL}  /  교사용: {URL}/teacher", ""])
set_text(ap[2], "(왼쪽: 학생 화면 활동1, 오른쪽: 교사 진행판 결과판과 마을 컵 비교)")

rep(sec, "국어과 평가자료: 관찰평가지", "수학과 평가자료: 관찰평가지", contains=True)
rep(sec, "국어과 평가자료: 자기평가지", "수학과 평가자료: 자기평가지", contains=True)
obs = tbl_by(lambda t: txt(t, 0, 1) == "상" and txt(t, 0, 2) == "중" and "평가요소" in txt(t, 0, 0))
set_cell(cell(obs, 1, 0), ["들이의 단위 L와 mL를 알고, 들이를 바르게 쓰고 읽으며 눈금을 읽어 잴 수 있는가?"])
set_cell(cell(obs, 1, 1), ["단위의 필요성을 설명하고, L·mL를 바르게 쓰고 읽으며 단위를 자유롭게 바꾸고 눈금을 정확히 읽을 수 있다."])
set_cell(cell(obs, 1, 2), ["L·mL를 쓰고 읽을 수 있고, 도움을 받아 단위를 바꾸거나 눈금을 읽을 수 있다."])
set_cell(cell(obs, 1, 3), ["L와 mL를 구별하여 읽을 수 있으나, 단위 바꾸기와 눈금 읽기에 어려움이 있다."])
selft = tbl_by(lambda t: txt(t, 0, 0) == "공부한 내용")
set_cell(cell(selft, 1, 0), ["1 L는 1000 mL임을 알고, 들이를 L와 mL로 쓰고 읽을 수 있나요?"])
set_cell(cell(selft, 2, 0), ["눈금을 읽어 들이를 재고, 짝과 협력하여 미션을 해결했나요?"])

# ───────────────────────── 활동지 ─────────────────────────
ws1, ws1a, ws2, ws2a = tops[115], tops[116], tops[117], tops[118]
for page in (ws1, ws1a, ws2, ws2a):
    rep(page, "4학년 (      )반  이름(               )", "3학년 (      )반  이름(               )")

N, Aa = "n", "a"


def ws1_fill(page, ans):
    a = (lambda blank, val: (val, Aa) if ans else (blank, N))
    rep(page, "잎싹이의 선택과 나의 생각은?", "우리 마을 들이 장부")
    rep(page, "[활동1] 작품 속 갈등 장면 분석 & 내 입장 정하기", "❍ [활동1] 물 거래 대소동 ─ 마을 컵으로 잰 결과 정리하기", contains=True)
    rep(page, "[활동2] 모둠 찬반 토론 정리하기", "❍ [활동2] 단위의 탄생 ─ 들이의 단위 쓰고 읽기", contains=True)
    t1, t2 = [t for t in page.iter(HP + "tbl")][:2]
    set_cell(cell(t1, 0, 1), ["작성란"])
    set_cell(cell(t1, 1, 0), ["1. 우리 마을 결과"])
    set_cell(cell(t1, 1, 1), [
        [("우리 마을: (", N), a("                   ", "  해바라기  "), (") 마을", N)],
        [("마법 항아리에는 우리 마을 컵으로 (", N), a("        ", "  6  "), (")컵만큼 물이 들어갑니다.", N)],
    ])
    set_cell(cell(t1, 2, 0), ["2. 여러 마을의 결과"])
    set_cell(cell(t1, 2, 1), [
        "※ 다른 마을의 결과를 듣고 적어 보세요.",
        [("해바라기 (", N), a("     ", " 6 "), (")컵    선인장 (", N), a("     ", " 4 "), (")컵    낙타 (", N), a("     ", " 8 "), (")컵", N)],
        [("별빛 (", N), a("     ", " 3 "), (")컵    야자수 (", N), a("     ", " 5 "), (")컵    조개 (", N), a("     ", " 12 "), (")컵", N)],
    ])
    set_cell(cell(t1, 3, 0), ["3. 결과가 다른", "까닭과 해결 방법"])
    set_cell(cell(t1, 3, 1), [[
        ("• 결과가 다른 까닭: ", N), a("", "마을마다 컵의 크기가 다르기 때문이다."),
        ("\n• 다툼을 없애려면? ", N), a("", "모두가 똑같이 쓰는 단위(기준)로 재야 한다."),
    ]])
    set_cell(cell(t2, 0, 1), ["작성란"])
    set_cell(cell(t2, 1, 0), ["1. 들이의 단위"])
    set_cell(cell(t2, 1, 1), [
        [("1 L 읽기: (", N), a("                    ", "  1 리터  "), (")      1 mL 읽기: (", N), a("                    ", "  1 밀리리터  "), (")", N)],
        "따라 쓰기:    L     L     L            mL     mL     mL",
    ])
    set_cell(cell(t2, 2, 0), ["2. 1 L와 1 mL"])
    set_cell(cell(t2, 2, 1), [
        [("100 mL를 10번 부으면 1 L 그릇이 가득 찹니다.  →  1 L = (", N), a("          ", "  1000  "), (") mL", N)],
    ])
    set_cell(cell(t2, 3, 0), ["3. 바꾸어 나타내기"])
    set_cell(cell(t2, 3, 1), [
        [("① 1 L 300 mL = (", N), a("              ", "  1300  "), (") mL", N)],
        [("② 2500 mL = (", N), a("      ", "  2  "), (") L (", N), a("            ", "  500  "), (") mL", N)],
        "③ ‘1 L 700 mL’를 읽어 보세요.",
        [("→ ", N), a("______________________________________________", "1 리터 700 밀리리터")],
    ])


def ws2_fill(page, ans, beaker_pic):
    a = (lambda blank, val: (val, Aa) if ans else (blank, N))
    rep(page, "<글쓰기> 내가 만약 잎싹이라면?", "평화의 눈금 ─ 눈금 읽고 들이 나타내기")
    rep(page, "[활동 1] 주장하는 글 쓰기 (내가 만약 잎싹이라면?)", "❍ [활동3] 눈금을 읽어 물의 양 나타내기", contains=True)
    rep(page, "[활동 2] 스스로 평가하기", "❍ [활동4] 스스로 평가하기", contains=True)
    t1, t2 = [t for t in page.iter(HP + "tbl")][:2]
    set_cell(cell(t1, 0, 0), ["그릇"])
    set_cell(cell(t1, 0, 1), ["물의 양 쓰기"])
    set_cell(cell(t1, 1, 0), ["눈금"])
    pcell = cell_pars(cell(t1, 1, 1))[0]
    set_text(pcell, "")
    run = pcell.find(HP + "run")
    run.insert(0, beaker_pic)
    set_cell(cell(t1, 2, 0), ["①"])
    set_cell(cell(t1, 2, 1), [
        [("물의 양: (", N), a("              ", "  600  "), (") mL", N)],
        [("읽기: (", N), a("                                        ", "  600 밀리리터  "), (")", N)],
    ])
    set_cell(cell(t1, 3, 0), ["②"])
    set_cell(cell(t1, 3, 1), [
        [("작은 눈금 한 칸은 (", N), a("          ", "  100  "), (") mL입니다.", N)],
        [("물의 양: (", N), a("              ", "  800  "), (") mL", N)],
    ])
    set_cell(cell(t1, 4, 0), ["③"])
    set_cell(cell(t1, 4, 1), [
        [("물의 양: (", N), a("      ", "  1  "), (") L (", N), a("            ", "  300  "), (") mL  =  (", N), a("              ", "  1300  "), (") mL", N)],
        [("읽기: (", N), a("                                        ", "  1 리터 300 밀리리터  "), (")", N)],
    ])
    set_cell(cell(t2, 1, 0), ["1. 1 L는 1000 mL라는 것을 알고, 들이를 L와 mL로 쓰고 읽을 수 있나요?"])
    set_cell(cell(t2, 2, 0), ["2. 눈금을 읽어 들이를 ‘□ L □ mL’와 ‘□ mL’로 나타낼 수 있나요?"])
    set_cell(cell(t2, 3, 0), ["3. 짝, 마을 친구와 협력하여 미션을 해결했나요?"])


ws1_fill(ws1, False)
ws1_fill(ws1a, True)
from PIL import Image
bw, bh = Image.open(os.path.join(IMG, "ws_beakers.png")).size
ws2_fill(ws2, False, new_pic_like(pic_template, "image18", bw // 2, bh // 2, 22000))
ws2_fill(ws2a, True, new_pic_like(pic_template, "image18", bw // 2, bh // 2, 22000))

# ───────────────────────── 저장 ─────────────────────────
section_bytes = etree.tostring(sec, xml_declaration=True, encoding="UTF-8", standalone=True)
hpf = zin.read("Contents/content.hpf").decode("utf8")
hpf = hpf.replace('<opf:item id="section0"',
                  '<opf:item id="image18" href="BinData/image18.PNG" media-type="image/png" isEmbeded="1"/><opf:item id="section0"')
replace_bin = {
    "BinData/image15.PNG": open(os.path.join(IMG, "student_a1.png"), "rb").read(),
    "BinData/image16.PNG": open(os.path.join(IMG, "teacher_a1.png"), "rb").read(),
}
prv = ("<수업안><초 3~4학년군><스토리 게임으로 탐구하는 들이의 단위 L와 mL><초등학교 3학년 수학>"
       "<들이와 무게 ─ 들이의 단위 L와 mL를 알고, 들이를 쓰고 읽으며 재기>")
with zipfile.ZipFile(OUT, "w") as zout:
    for item in zin.infolist():
        name = item.filename
        if name == "Contents/section0.xml":
            data = section_bytes
        elif name == "Contents/content.hpf":
            data = hpf.encode("utf8")
        elif name in replace_bin:
            data = replace_bin[name]
        elif name == "Preview/PrvText.txt":
            data = prv.encode("utf-8")
        else:
            data = zin.read(name)
        ct = zipfile.ZIP_STORED if name == "mimetype" else zipfile.ZIP_DEFLATED
        zout.writestr(item if name == "mimetype" else zipfile.ZipInfo(name, item.date_time), data, compress_type=ct)
    zout.writestr(zipfile.ZipInfo("BinData/image18.PNG", (2026, 11, 16, 0, 0, 0)),
                  open(os.path.join(IMG, "ws_beakers.png"), "rb").read(), compress_type=zipfile.ZIP_DEFLATED)
print("저장:", OUT)
