"""Generează diagrame PNG pentru documentația de licență MedAI."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

OUT = Path(__file__).parent / "assets" / "diagrams"
OUT.mkdir(parents=True, exist_ok=True)

W, H = 1100, 700
BG = (255, 255, 255)
BOX = (58, 106, 214)
BOX2 = (46, 139, 87)
BOX3 = (220, 120, 50)
TEXT = (30, 30, 30)
ARROW = (80, 80, 80)


def font(size=16):
    try:
        return ImageFont.truetype("arial.ttf", size)
    except OSError:
        return ImageFont.load_default()


def box(draw, x, y, w, h, label, fill=BOX, fsize=14):
    draw.rounded_rectangle([x, y, x + w, y + h], radius=8, fill=fill, outline=(30, 30, 30))
    f = font(fsize)
    lines = label.split("\n")
    line_h = fsize + 4
    start_y = y + (h - len(lines) * line_h) / 2
    for i, line in enumerate(lines):
        tw = draw.textlength(line, font=f)
        draw.text((x + (w - tw) / 2, start_y + i * line_h), line, fill=(255, 255, 255), font=f)


def arrow(draw, x1, y1, x2, y2):
    draw.line([(x1, y1), (x2, y2)], fill=ARROW, width=2)
    if x2 > x1:
        draw.polygon([(x2, y2), (x2 - 10, y2 - 5), (x2 - 10, y2 + 5)], fill=ARROW)
    elif y2 > y1:
        draw.polygon([(x2, y2), (x2 - 5, y2 - 10), (x2 + 5, y2 - 10)], fill=ARROW)


def arch_diagram():
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    d.text((350, 20), "Arhitectura sistemului MedAI", fill=TEXT, font=font(22))
    box(d, 80, 80, 200, 60, "Browser\n(React SPA)", BOX)
    box(d, 420, 60, 260, 50, "Azure Static Web Apps", BOX2)
    box(d, 420, 140, 260, 50, "Azure App Service\n(Express API)", BOX2)
    box(d, 420, 220, 260, 50, "Azure Functions\n(API auxiliar)", BOX2)
    box(d, 780, 120, 200, 60, "Azure SQL\n(MedAI DB)", BOX3)
    box(d, 780, 280, 200, 50, "OpenAI API\nGPT-3.5-turbo", BOX3)
    box(d, 80, 280, 200, 50, "CSV static\n6479 medicamente", BOX3)
    arrow(d, 280, 110, 420, 85)
    arrow(d, 280, 110, 420, 165)
    arrow(d, 680, 165, 780, 150)
    arrow(d, 680, 245, 780, 150)
    arrow(d, 550, 190, 550, 220)
    arrow(d, 680, 165, 780, 305)
    arrow(d, 280, 305, 420, 245)
    d.text((60, 400), "Strat prezentare: React 18 + Vite | Strat logică: Node.js Express | Strat date: Azure SQL + CSV", fill=TEXT, font=font(13))
    d.text((60, 430), "Servicii externe: OpenAI pentru chatbot și sfaturi medicale", fill=TEXT, font=font(13))
    img.save(OUT / "01-arhitectura-sistem.png")


def modules_diagram():
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    d.text((300, 15), "Module funcționale MedAI", fill=TEXT, font=font(22))
    modules = [
        (60, 80, "Autentificare\n& Admin"),
        (300, 80, "Căutare &\nFiltrare"),
        (540, 80, "Rețete\nDigitale"),
        (780, 80, "Chatbot\nAI"),
        (60, 220, "Istoric\nRețete"),
        (300, 220, "Medicamente\nUtilizator"),
        (540, 220, "Speech-to-\nText"),
        (780, 220, "Export\nPDF"),
    ]
    for x, y, lbl in modules:
        box(d, x, y, 180, 70, lbl, BOX, 13)
    box(d, 350, 380, 400, 60, "Nucleu: MedicinesTable.jsx + Backend API REST", BOX2, 14)
    for x, y, _ in modules:
        arrow(d, x + 90, y + 70, 550, 380)
    img.save(OUT / "02-module-functionale.png")


def usecase_prescriere():
    img = Image.new("RGB", (W, 600), BG)
    d = ImageDraw.Draw(img)
    d.text((280, 15), "Caz de utilizare: Prescriere medic", fill=TEXT, font=font(20))
    box(d, 40, 250, 120, 50, "Medic", BOX3, 13)
    actions = ["Autentificare", "Filtrare medicamente", "Adăugare în coș", "Plan tratament", "Sfaturi AI", "Salvare rețetă", "Export PDF"]
    for i, a in enumerate(actions):
        x = 200 + i * 115
        box(d, x, 100, 100, 45, a, BOX, 11)
        arrow(d, 160, 275, x + 50, 145)
    d.text((40, 520), "Actor: Medic autorizat | Precondiție: cont aprobat | Postcondiție: rețetă salvată în BD", fill=TEXT, font=font(12))
    img.save(OUT / "03-usecase-prescriere.png")


def usecase_chatbot():
    img = Image.new("RGB", (W, 500), BG)
    d = ImageDraw.Draw(img)
    d.text((250, 15), "Caz de utilizare: Recomandări AI", fill=TEXT, font=font(20))
    box(d, 40, 200, 130, 50, "Utilizator", BOX3, 13)
    for i, a in enumerate(["Deschide chat", "Descrie simptome", "Analiză GPT", "Recomandare CNAS"]):
        box(d, 220 + i * 200, 100, 170, 45, a, BOX, 12)
        arrow(d, 170, 225, 220 + i * 200 + 85, 145)
    img.save(OUT / "04-usecase-chatbot.png")


def usecase_admin():
    img = Image.new("RGB", (W, 500), BG)
    d = ImageDraw.Draw(img)
    d.text((220, 15), "Caz de utilizare: Administrare conturi", fill=TEXT, font=font(20))
    box(d, 40, 200, 130, 50, "Administrator", BOX3, 13)
    for i, a in enumerate(["Signup utilizator", "Vizualizare cereri", "Aprobare/Respingere", "Acces complet"]):
        box(d, 220 + i * 200, 100, 170, 45, a, BOX, 11)
        arrow(d, 170, 225, 220 + i * 200 + 85, 145)
    img.save(OUT / "05-usecase-admin.png")


def er_diagram():
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    d.text((380, 15), "Diagramă entitate-relație", fill=TEXT, font=font(22))
    tables = [
        (60, 80, "users\nid, nume, email\nparola, status\nis_admin"),
        (320, 80, "medications\nid, denumire\nsubstanta_activa\ncod_atc, coduri_boli"),
        (580, 80, "retete\nid, user_id\nmedicamente (JSON)\nplanuri_tratament"),
        (840, 80, "user_medicines\nid, user_id\ndenumire, cod_atc"),
    ]
    for x, y, lbl in tables:
        box(d, x, y, 200, 100, lbl, BOX2, 11)
    arrow(d, 260, 130, 320, 130)
    arrow(d, 160, 180, 160, 350)
    arrow(d, 160, 350, 680, 350)
    arrow(d, 680, 180, 680, 180)
    arrow(d, 160, 350, 940, 350)
    arrow(d, 940, 180, 940, 350)
    d.text((60, 400), "users 1──N retete | users 1──N user_medicines | medications independent (date CNAS)", fill=TEXT, font=font(13))
    img.save(OUT / "06-diagrama-er.png")


if __name__ == "__main__":
    arch_diagram()
    modules_diagram()
    usecase_prescriere()
    usecase_chatbot()
    usecase_admin()
    er_diagram()
    print(f"Diagrame salvate în {OUT}")
