const pdf = require('pdf-parse');
const fs = require('fs');

function validateTest() {
    const title = "title";
    const pdfName = "try2";
    const cat_id = '1';
    const answers1 = [];
    let questions1 = [];
    let dataBuffer = fs.readFileSync(`./${pdfName}.pdf`)
    pdf(dataBuffer).then(function(data) {
    //This split every question(wich starts from 1 because first is intro shit)
    const dataArray = data.text.split("QUESTION");
    shuffle(dataArray);
    const answers = [];
    const questions = [];
    for(let i = 1; i < dataArray.length; i++) {
        //This is every line of a question
        let myData = dataArray[i].split('\n');
        
        //Filter Headers And Footers
        myData = myData.filter(data => !data.includes('ActualTests.com') && !data.includes('Practice Exam') && !data.includes('Pass Any Exam. Any Time') &&
        !data.includes('Explanation:'))

        //This is the whole answer line
        let answerLine = '';
        myData.forEach(data => {
        if(data.includes('Answer: ')) {
            answerLine = data;
        }
        });

        //This is the answer
        const answer = answerLine.split(": ")[1];

        //This is the question lines without answer And alternatives
        let questionLines = myData.filter(line => !line.includes('Answer: ') && !line.includes('NO:'));
        let questionOutput = '';
        questionLines.forEach(question => {
        if(question == ' ') {
            question += '\n';
        } else {
            questionOutput += question;
        }
        })
        questions.push(questionOutput);
        answers.push(answer)
    }
    }
    )
}

function shuffle(array) {
for (let i = array.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
}
}

module.exports.validateTest = validateTest;