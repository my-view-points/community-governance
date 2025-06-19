import os
import re
import subprocess
import sys

import markdown2

mermaid_cli_path = "../node_modules/@mermaid-js/mermaid-cli/src/cli.js"


def convert(path: str):
    with open(path, encoding="utf-8") as f:
        lines = list(f.readlines())

    input_path = "input.mmd"
    output_path = "output.svg"

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

                with open(input_path, mode="w", encoding="utf-8") as f:
                    f.writelines(lines[begin + 1 : end])
                subprocess.run(
                    ["node", mermaid_cli_path, "-i", input_path, "-o", output_path],
                    stdout=subprocess.PIPE,
                )
                with open(output_path, encoding="utf-8") as f:
                    images.append([begin, end, f.read()])

                begin = None
                end = None

    html_path = os.path.join(os.path.dirname(path), "index.html")
    with open(html_path, mode="w", encoding="utf-8") as f:
        for index in range(len(images)):
            (begin, end, _svg) = images[index]
            lines[begin : end + 1] = [f"{index}\n"] * (end + 1 - begin)
            images[index].append(re.compile(rf"<p>{index}(\n{index})+</p>"))

        html = markdown2.markdown("".join(lines), extras=["tables"])
        for index, (_begin, _end, svg, pattern) in enumerate(images):
            html = pattern.sub(repl=svg, string=html, count=1)
        f.write(html)

    if os.path.exists(input_path):
        os.remove(input_path)

    if os.path.exists(output_path):
        os.remove(output_path)


if __name__ == "__main__":
    convert(sys.argv[1])
