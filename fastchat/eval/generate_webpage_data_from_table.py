"""Generate json file for webpage."""
from typing import List, Dict
import json
import os
import re
import sys


def read_jsonl(path: str, key: str = None):
    data = []
    with open(os.path.expanduser(path)) as f:
        for line in f:
            if not line:
                continue
            data.append(json.loads(line))
    if key is not None:
        data.sort(key=lambda x: x[key])
        data = {item[key]: item for item in data}
    return data


def trim_hanging_lines(s: str, n: int) -> str:
    s = s.strip()
    for _ in range(n):
        s = s.split("\n", 1)[1].strip()
    return s


def clean_retrieval(example):
    qds = example["metadata"]["retrieval_queries_docs"]
    return [(q, [{k: d[k] for k in ['score', 'body', 'title']} for d in ds]) for q, ds in qds]


if __name__ == "__main__":
    table_root = sys.argv[1]

    questions: Dict[str, Dict] = read_jsonl(f"{table_root}/question.jsonl", key="question_id")
    models: List[str] = [json.loads(l)["model_id"] for l in open(f"{table_root}/model.jsonl")]
    base_model: str = models[0]
    compare_models: List[str] = models[1:]

    model2answers: Dict[str, Dict] = {model: read_jsonl(f"{table_root}/answer/{model}.jsonl", key="question_id") for model in models}
    model2reviews: Dict[str, Dict] = {model: read_jsonl(f"{table_root}/review/{model}.jsonl", key="question_id") for model in compare_models}

    records = []
    for qid in questions.keys():
        r = {
            "id": qid,
            "category": questions[qid]["category"],
            "question": questions[qid]["text"],
            "prompts": {model: ans[qid]["metadata"]["prompt"] for model, ans in model2answers.items()},
            "answers": {model: ans[qid]["text"] for model, ans in model2answers.items()},
            "retrieval": {model: clean_retrieval(ans[qid]) for model, ans in model2answers.items()},
            "evaluations": {model: ans[qid]["text"] for model, ans in model2reviews.items()},
            "scores": {model: ans[qid]["score"] for model, ans in model2reviews.items()},
        }

        # cleanup data
        cleaned_evals = {}
        for k, v in r["evaluations"].items():
            v = v.strip()
            lines = v.split("\n")
            # trim the first line if it's a pair of numbers
            if re.match(r"\d+[, ]+\d+", lines[0]):
                lines = lines[1:]
            v = "\n".join(lines)
            cleaned_evals[k] = v.replace("Assistant 1", "**Assistant 1**").replace(
                "Assistant 2", "**Assistant 2**"
            )

        r["evaluations"] = cleaned_evals
        records.append(r)

    '''
    # Reorder the records, this is optional
    for r in records:
        if r["id"] <= 20:
            r["id"] += 60
        else:
            r["id"] -= 20
    for r in records:
        if r["id"] <= 50:
            r["id"] += 10
        elif 50 < r["id"] <= 60:
            r["id"] -= 50
    for r in records:
        if r["id"] == 7:
            r["id"] = 1
        elif r["id"] < 7:
            r["id"] += 1
    '''

    records.sort(key=lambda x: x["id"])

    # Write to file
    with open(f"{table_root}/data.json", "w") as f:
        json.dump({"questions": records, "models": compare_models, "base_model": base_model}, f, indent=2)
