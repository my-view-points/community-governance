import os
import subprocess
import sys

import markdown

mermaid_cli_path = "../node_modules/@mermaid-js/mermaid-cli/src/cli.js"


def convert(path: str):
    with open(path, encoding="utf-8") as f:
        lines = list(f.readlines())

    input_path = "input.mmd"
    output_path = "output.svg"

    begin = None
    end = None
    svg_images = []
    for no in range(len(lines)):
        line = lines[no]
        if line.startswith("```mermaid"):
            begin = no
            end = None
        elif line.startswith("```"):
            if begin is not None:
                end = no

                with open(input_path, mode="w", encoding="utf-8") as f:
                    f.writelines(lines[begin + 1 : end])
                subprocess.run(
                    ["node", mermaid_cli_path, "-i", input_path, "-o", output_path], stdout=subprocess.PIPE
                )
                with open(output_path, encoding="utf-8") as f:
                    svg_images.append((begin, end, f.read()))

                begin = None
                end = None

    html_path = os.path.join(os.path.dirname(path), "index.html")
    with open(html_path, mode="w", encoding="utf-8") as f:
        for (index, (begin, end, _svg)) in enumerate(svg_images):
            lines[begin : end + 1] = f"{str(index) * 50}\n"

        html = markdown.markdown("".join(lines))
        for (index, (_begin, _end, svg)) in enumerate(svg_images):
            html = html.replace(f"<p>{str(index) * 50}</p>", f"<div>{svg}</div>", 1)
        f.write(html)

    if os.path.exists(input_path):
        os.remove(input_path)

    if os.path.exists(output_path):
        os.remove(output_path)


if __name__ == "__main__":
    convert(sys.argv[1])
