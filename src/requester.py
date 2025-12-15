from QuestionGenerator import QuestionGenerator

model = QuestionGenerator()

input = open("input.txt").read()
output_json = model.make_request(input)

for q in output_json:
    print(q.get("Question") + ":")
    for i, o in enumerate(q.get("Options")):
        print(f"{i+1}. {o}")
    print(f"Correct: {q.get('Ans')}")
    print("------------------")