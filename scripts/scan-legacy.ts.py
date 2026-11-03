# 扫描 public/legacy 生成 src/data/legacy-labs.ts（参考实验注册表）
import re
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent / "public" / "legacy"
TARGET = Path(__file__).resolve().parent.parent / "src" / "data" / "legacy-labs.ts"

GROUPS = [
    ("bx1", "必修一 · 分子与细胞", "BX1"),
    ("bx2", "必修二 · 遗传与进化", "BX2"),
    ("xx1", "选择性必修一 · 稳态与调节", "XX1"),
    ("xx2", "选择性必修二 · 生物与环境", "XX2"),
    ("xx3", "选择性必修三 · 生物技术与工程", "XX3"),
    ("初中人体的营养和调节", "初中 · 营养与调节", "J1"),
    ("初中生物的层次与植物的生活", "初中 · 结构与植物生活", "J2"),
    ("初中生物的遗传变异", "初中 · 生殖与遗传", "J3"),
    ("初中生物多样性和生态", "初中 · 多样性与生态", "J4"),
]


def entry_html(folder: Path):
    htmls = sorted(folder.rglob("*.html"), key=lambda p: (p.name != "index.html", -p.stat().st_size))
    return htmls[0] if htmls else None


def title_of(page: Path) -> str:
    try:
        head = page.read_text(encoding="utf-8", errors="ignore")[:6000]
        m = re.search(r"<title>([^<]+)</title>", head, re.I)
        if m:
            t = m.group(1).strip()
            t = re.sub(r"\s*[-—|｜].*$", "", t).strip()
            if t:
                return t
    except Exception:
        pass
    return page.parent.name


rows = []
for folder_name, group_label, module in GROUPS:
    base = ROOT / folder_name
    if not base.exists():
        continue
    for idx, folder in enumerate(sorted(p for p in base.iterdir() if p.is_dir()), 1):
        page = entry_html(folder)
        if not page:
            continue
        rel = page.relative_to(ROOT).as_posix()
        rows.append((module, group_label, f"{folder_name}-{idx:03d}", title_of(page), rel))

out = [
    "// 由 scripts/scan-legacy.ts.py 扫描 public/legacy 生成（来源：参考/闫老师400个生物交互html，本地资源不入 git）",
    "// group 为教材册别；module 为册别分区 id（与知识地图模块并列，不交叉挂载避免错误归类）",
    "",
    "export interface LegacyLab {",
    "  id: string;",
    "  title: string;",
    "  group: string;",
    "  module: string;",
    "  path: string; // 相对 public 的入口 HTML 路径",
    "}",
    "",
    "export const legacyLabs: LegacyLab[] = [",
]
for module, group_label, lab_id, title, rel in rows:
    t = title.replace("\\", "").replace('"', "")
    out.append(f'  {{ id: "{lab_id}", title: "{t}", group: "{group_label}", module: "{module}", path: "legacy/{rel}" }},')
out.append("];")

TARGET.write_text("\n".join(out) + "\n", encoding="utf-8")
print(f"注册 {len(rows)} 个参考实验")
for k, v in sorted(Counter(r[0] for r in rows).items()):
    print(f"  模块 {k}: {v} 个")
