// Description: Script for the evaluation webpage.

// Store the model name mapping for later use.
modelNameMapping = {
    "gpt35": "ChatGPT-3.5",
    "gpt4": "GPT-4",
    "alpaca": "Alpaca-13b",
    "vicuna": "Vicuna-13b",
    "llama": "LLaMA-13b",
    "bard": "Bard",
};

modelFigureMapping = {
    "vicuna": "figures/vicuna.jpeg",
    // Image from: https://commons.wikimedia.org/wiki/File:ChatGPT_logo.svg
    "gpt35": "figures/chatgpt.svg",
    // Image from: https://www.reddit.com/r/logodesign/comments/1128aat/google_ai_bard_logo_design/
    "bard": "figures/bard.jpg",
    // Image from: https://crfm.stanford.edu/2023/03/13/alpaca.html
    "alpaca": "figures/alpaca.png",
    // Image adapted from https://commons.wikimedia.org/wiki/File:Llama_on_Machu_Picchu.jpg
    "llama": "figures/llama.jpg",
}

// Store the question data in a mapping for later use.
questionMapping = {};
all_questionids = []
let currentQuestionIndex = -1;
let ques_ind = 0;
// Store the question ids in a mapping for later use.
categoryMapping = {};
// Store the number of questions for later use.
questionsCount = 0;
// Store model names
modelMapping = {'base': ''}

function text2Markdown(text) {
    // Normalize the text for markdown rendering.
    text = text.trim().replaceAll('\n\n', '\n').replaceAll('\n', '\n\n');
    return marked.parse(text);
}

function capitalizeFirstChar(str) {
    if (!str || str.length === 0) {
      return str;
    }
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function updateQuestionSelect(question_id) {
    const select = document.getElementById('question-select');
    // Clear the question select.
    select.innerHTML = '';
    // Populate the question select.
    category = questionMapping[question_id].category;
    categoryMapping[category].forEach(question_id => {
        const question = questionMapping[question_id];
        const option = document.createElement('option');
        option.value = question_id;
        //option.textContent = 'Q' + question_id.toString() + ': ' + question.question;
        option.textContent = 'Q: ' + question.question;
        select.appendChild(option);
    });
    select.value = question_id;
}

function updateModelSelect() {
    const select = document.getElementById('model-select');
    img_path = modelFigureMapping[select.value];
    document.getElementById('other-model-figure').src = img_path;
}

function populateModels(models, base_model) {
    modelMapping['base'] = base_model
    const select = document.getElementById('model-select');
    models.forEach(model => {
        const option = document.createElement('option');
        option.value = model;
        option.textContent = model;
        select.appendChild(option);
    });
    updateModelSelect();
}

function populateQuestions(questions) {
    const category_select = document.getElementById('category-select');

    questionsCount = questions.length;
    questions.forEach(question => {
        const option = document.createElement('option');
        // Store the question data in a mapping for later use.
        all_questionids.push(question.id)
        questionMapping[question.id] = {
            category: question.category,
            question: question.question,
            answers: question.answers,
            prompts: question.prompts,
            retrieval: question.retrieval,
            evaluations: question.evaluations,
            scores: question.scores,
        };
        // Store the question id in the category mapping.
        if (question.category in categoryMapping) {
            categoryMapping[question.category].push(question.id);
        } else {
            categoryMapping[question.category] = [question.id];
            const category_option = document.createElement('option');
            category_option.value = question.category;
            category_option.textContent = capitalizeFirstChar(question.category);
            category_select.appendChild(category_option);
        }
    });
    // Set the default category.
    currentQuestionIndex = all_questionids[ques_ind]
    updateQuestionSelect(currentQuestionIndex);
}

function displayQuestion(index) {
    const question = questionMapping[index].question;
    document.getElementById('selected-question').innerHTML = text2Markdown('**Question:** ' + question);
    displayAnswers(index);
}

function displayAnswers(index) {
    const question = questionMapping[index];
    const otherModel = document.getElementById('model-select').value;
    // render the answers with markdown
    document.getElementById('other-model-answer').innerHTML = text2Markdown('**Answer**\n' + question.answers[otherModel]);
    document.getElementById('our-model-answer').innerHTML = text2Markdown('**Answer**\n' + question.answers[modelMapping['base']]);

    // render prompts
    if (question.prompts) {
        document.getElementById('other-model-prompt').innerHTML = text2Markdown('**Prompt**\n' + question.prompts[otherModel]);
        document.getElementById('our-model-prompt').innerHTML = text2Markdown('**Prompt**\n' + question.prompts[modelMapping['base']]);
    }

    // Display evaluation
    score = question.scores[otherModel];
    score_text = otherModel + " " + score[0] + "/10, " + modelMapping['base'] + " " + score[1] + "/10";
    document.getElementById('evaluation-header').textContent = "GPT-4 Evaluation" + " (Score: " + score_text + ")";
    document.getElementById('evaluation-result').innerHTML = text2Markdown(question.evaluations[otherModel]);

    // Update model names
    let assistant1_title = "Assistant #1"; // (" + modelNameMapping[otherModel] + ")";
    let assistant2_title = "Assistant #2 " + modelMapping['base'];
    // Update scores/labels.
    let assistant1_score_label = score[0].toString() + '/10';
    let assistant2_score_label = score[1].toString() + '/10';

    const colorRed ='#fa9'; // '#eb978d';
    // const colorGreen = '#c9f2c9';
    const colorBlue = '#8ef'; // '#71dbf9';
    const colorYellow = '#fe7'; // '#fada57';
    let otherModelHeaderColor = '';
    let ourModelHeaderColor = '';
    // Update the winner.
    if (score[0] == score[1]) {
        assistant1_title = '🏆 ' + assistant1_title;
        assistant1_score_label = '🏆 ' + assistant1_score_label;
        assistant2_title = '🏆 ' + assistant2_title;
        assistant2_score_label = '🏆 ' + assistant2_score_label;
        otherModelHeaderColor = colorYellow;
        ourModelHeaderColor = colorYellow;
    } else if (score[0] > score[1]) {
        assistant1_title = '🏆 ' + assistant1_title;
        assistant1_score_label = '🏆 ' + assistant1_score_label;
        otherModelHeaderColor = colorBlue;
        ourModelHeaderColor = colorRed;
    } else if (score[0] < score[1]) {
        assistant2_title = '🏆 ' + assistant2_title;
        assistant2_score_label = '🏆 ' + assistant2_score_label;
        otherModelHeaderColor = colorRed;
        ourModelHeaderColor = colorBlue;
    }

    document.getElementById('other-model-header-bg').style.backgroundColor = otherModelHeaderColor;
    document.getElementById('our-model-header').style.backgroundColor = ourModelHeaderColor;

    document.getElementById('other-model-header').textContent = assistant1_title;
    document.getElementById('our-model-header').textContent = assistant2_title;

    document.getElementById('other-score-label').textContent = assistant1_score_label;
    document.getElementById('our-score-label').textContent = assistant2_score_label;

    // Update expand buttons visibility for both cards after displaying answers
    // Reset the expanded state and update expand buttons visibility for both cards after displaying answers
    document.querySelectorAll('.expandable-card').forEach(card => {
        card.classList.remove('expanded');
        updateExpandButtonVisibility(card);
        card.querySelector('.expand-btn').innerHTML = '<i class="material-icons" style="pointer-events: none">keyboard_arrow_down</i> Show more';   // .textContent = 'Show more';
    });

    displayRetrieval(index)
}

function displayRetrieval(index) {
    const question = questionMapping[index];
    const otherModel = document.getElementById('model-select').value;

    // populate retrieval of other model
    const otherSelect = document.getElementById('other-retrieval-select');
    otherSelect.innerHTML = '';
    question.retrieval[otherModel].forEach(function (ret, ind) {
        const option = document.createElement('option');
        option.value = ind;
        option.textContent = "Query " + ind + ": " + ret[0];
        otherSelect.appendChild(option);
    });
    displayRetrievalDocuments(index, 'other')

    // populate retrieval of base model
    const ourSelect = document.getElementById('our-retrieval-select');
    ourSelect.innerHTML = '';
    question.retrieval[modelMapping['base']].forEach(function (ret, ind) {
        const option = document.createElement('option');
        option.value = ind;
        option.textContent = "Query " + ind + ": " + ret[0];
        ourSelect.appendChild(option);
    });
    displayRetrievalDocuments(index, 'our')    
}

function displayRetrievalDocuments(index, modelCate) {
    const question = questionMapping[index];
    if (modelCate == "other") {
        model = document.getElementById('model-select').value;
        ret = document.getElementById('other-retrieval-select').value;
        document.getElementById('other-model-retrieval').innerHTML = "";
    } else {
        model = modelMapping['base'];
        ret = document.getElementById('our-retrieval-select').value;
        document.getElementById('our-model-retrieval').innerHTML = "";
    };
    
    if (ret == "") {
        return
    };

    query = question.retrieval[model][ret][0];
    docs = question.retrieval[model][ret][1].slice(0, 5);  // show at most 5 docs
    let linearized_docs = docs.reduce(function(linearized, doc, ind, array) {
        title = doc["title"];
        text = doc["body"];
        score = doc["score"];
        return linearized + "\n#### Doc " + (ind + 1) + "\n**Title: " + title + "** (score: " + score + ")\n" + text;
    }, "**Query: " + query + "**");

    if (modelCate == "other") {
        document.getElementById('other-model-retrieval').innerHTML = text2Markdown(linearized_docs);
    } else {
        document.getElementById('our-model-retrieval').innerHTML = text2Markdown(linearized_docs);
    };
}

document.getElementById('question-select').addEventListener('change', e => {
    currentQuestionIndex = e.target.value;
    ques_ind = all_questionids.indexOf(currentQuestionIndex);
    displayQuestion(currentQuestionIndex);
});

document.getElementById('category-select').addEventListener('change', e => {
    let currentCategory = e.target.value;
    const questionIds = categoryMapping[currentCategory];
    currentQuestionIndex = questionIds[0];
    ques_ind = all_questionids.indexOf(currentQuestionIndex);
    updateQuestionSelect(currentQuestionIndex);
    displayQuestion(currentQuestionIndex);
});

// Update expand buttons whenever the model is changed
document.getElementById('model-select').addEventListener('change', () => {
    displayAnswers(currentQuestionIndex);
    document.querySelectorAll('.expandable-card').forEach(card => {
        updateExpandButtonVisibility(card);
    });
    updateModelSelect();
});

function switchQuestionAndCategory() {
    document.getElementById('question-select').value = currentQuestionIndex;
    old_category = document.getElementById('category-select').value;
    new_category = questionMapping[currentQuestionIndex].category;
    if (old_category != new_category) {
        document.getElementById('category-select').value = new_category;
        updateQuestionSelect(currentQuestionIndex);
    }
    displayQuestion(currentQuestionIndex);
}

// TODO: not working
document.getElementById('prev-question').addEventListener('click', () => {
    // Question index starts from 1.
    ques_ind = Math.max(0, ques_ind - 1);
    currentQuestionIndex = all_questionids[ques_ind];
    switchQuestionAndCategory();
});

// TODO: not working
document.getElementById('next-question').addEventListener('click', () => {
    // Question index starts from 1.
    ques_ind = Math.min(questionsCount, ques_ind + 1);
    currentQuestionIndex = all_questionids[ques_ind];
    switchQuestionAndCategory();
});

document.getElementById('other-retrieval-select').addEventListener('change', e => {
    displayRetrievalDocuments(currentQuestionIndex, 'other');
});

document.getElementById('our-retrieval-select').addEventListener('change', e => {
    displayRetrievalDocuments(currentQuestionIndex, 'our');
});

function updateExpandButtonVisibility(card) {
    ctc = card.querySelector('.card-text-container');
    btn = card.querySelector('.expand-btn');
    btn.style.display = 'flex';
    //if (ctc.scrollHeight > ctc.offsetHeight) {
    //    btn.style.display = 'flex';
    //} else {
    //    btn.style.display = 'none';
    //    card.classList.add('expanded');
    //}
}

document.querySelectorAll('.expand-btn').forEach(btn => {
    btn.addEventListener('click', e => {
        card = e.target.closest('.expandable-card');
        card.classList.toggle('expanded');
        const more = '<i class="material-icons" style="pointer-events: none">keyboard_arrow_down</i> Show more';
        const less = '<i class="material-icons" style="pointer-events: none">keyboard_arrow_up</i> Show less';
        e.target.innerHTML = card.classList.contains('expanded') ? less : more;
    });
});
