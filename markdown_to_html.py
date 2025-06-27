import os
import re
import sys

import markdown2

from playwright.sync_api import sync_playwright

PLAYWRIGHT_MANAGER = None
BROWSER_INSTANCE = None


def get_browser():
    global PLAYWRIGHT_MANAGER, BROWSER_INSTANCE
    if BROWSER_INSTANCE is None:
        PLAYWRIGHT_MANAGER = sync_playwright().start()
        BROWSER_INSTANCE = PLAYWRIGHT_MANAGER.chromium.launch()
    return BROWSER_INSTANCE


def shutdown_playwright():
    global PLAYWRIGHT_MANAGER, BROWSER_INSTANCE
    if BROWSER_INSTANCE:
        BROWSER_INSTANCE.close()
    if PLAYWRIGHT_MANAGER:
        PLAYWRIGHT_MANAGER.stop()


def mermaid_to_svg(mermaid_text: str) -> str:
    browser = get_browser()
    page = browser.new_page()

    script_path = os.path.dirname(__file__) + "/mermaid@11.7.0.min.js"
    if os.name == "nt":
        script_path = script_path.replace("\\", "/")
    with open(script_path, encoding="utf-8") as f:
        script = f.read()

    html_content = f"""
    <!DOCTYPE html>
    <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>Mermaid Renderer</title>
            <script>{script}</script>
        </head>
        <body>
        </body>
    </html>
    """

    svg_code = ""
    try:
        page.set_content(html_content)

        page.wait_for_function("window.mermaid")

        svg_code = page.evaluate(
            """async (diagram) => {
                try {
                    mermaid.initialize({ startOnLoad: false, theme: 'default' });
                    const { svg } = await mermaid.render('graph-div', diagram);
                    return svg;
                } catch (e) {
                    return e.toString();
                }
            }""",
            mermaid_text,
        )

    finally:
        page.close()

    return svg_code


def markdown_to_html(path: str):
    with open(path, encoding="utf-8") as f:
        lines = list(f.readlines())

    begin = None
    end = None
    images = []
    for no in range(len(lines)):
        line = lines[no]
        if line.startswith("```mermaid"):
            begin = no
            end = None
        elif line.startswith("```"):
            if begin is not None:
                end = no

                svg_text = mermaid_to_svg("".join(lines[begin + 1 : end]))
                images.append([begin, end, svg_text])

                begin = None
                end = None

    style_path = os.path.dirname(__file__) + "/pygments.default@2.19.2.css"
    if os.name == "nt":
        style_path = style_path.replace("\\", "/")
    with open(style_path, encoding="utf-8") as f:
        style = f.read()

    html_path = os.path.join(os.path.dirname(path), "index.html")
    with open(html_path, mode="w", encoding="utf-8") as f:
        for index in range(len(images)):
            (begin, end, _svg) = images[index]
            lines[begin : end + 1] = [f"{index}\n"] * (end + 1 - begin)
            images[index].append(re.compile(rf"<p>{index}(\n{index})+</p>"))

        html = markdown2.markdown("".join(lines), extras=["fenced-code-blocks", "tables"])
        for index, (_begin, _end, svg, pattern) in enumerate(images):
            html = pattern.sub(repl=svg, string=html, count=1)

        h1 = re.search(pattern="<h1><strong>(.*?)</strong></h1>", string=html).group(1)
        f.write(
            f"""<!DOCTYPE html>
<html>
    <head>
        <title>{h1}</title>
        <style>{style}</style>
    </head>
    <body>
"""
        )
        f.write(html)
        f.write(
            """
    </body>
</html>
"""
        )

    shutdown_playwright()


if __name__ == "__main__":
    markdown_to_html(sys.argv[1])
