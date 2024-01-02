import fs from 'fs';
import { marked } from 'marked';
import fm from 'front-matter';
import hljs from 'highlight.js';

const template = fs.readFileSync('./templates/page.html', 'utf-8');

marked.setOptions({
    highlight: function (code, lang) {
        const language = hljs.getLanguage(lang) ? lang : 'plaintext';
        return hljs.highlight(code, { language }).value;
    },
    smartLists: true,
    smartypants: true,
});

function getPartSuffix(partNum: number) {
    if (partNum === 1) {
        return 'st';
    }
    if (partNum === 2) {
        return 'nd';
    }
    if (partNum === 3) {
        return 'rd';
    }
    return 'th';
}

let output = '';
const contentFolder = './content';
const files = fs.readdirSync(contentFolder);
for (let file of files) {
    if (file.endsWith('.md')) {
        console.log('Processing', file);
        const fileRegex = /day-(\d+)(-\d+)?.md/;
        const match = fileRegex.exec(file);
        if (!match) {
            console.error('Invalid file name', file);
            continue;
        }
        const chapterNum = parseInt(match[1]);
        const chapterPart = match[2] ? parseInt(match[2].slice(1)) : 0;
        let chapterPartHtml = '';
        if (chapterPart > 0) {
            chapterPartHtml = `<h4 class="no-break">${chapterPart}<sup>${getPartSuffix(
                chapterPart
            )}</sup></h4>`;
        }

        const markdown = fs.readFileSync(contentFolder + '/' + file, 'utf-8');
        const { attributes, body } = fm(markdown);
        const html = marked(body);
        const metadata = {
            title: (attributes as any)['title'],
            description: (attributes as any)['author'],
            topic: (attributes as any)['topic'],
            chapterNum,
            chapterPart,
        };
        const chapterCover = `
        <div class="chapter-cover">
            <div class="chapter-name">
                <h1 class="no-break" data-num="${metadata.chapterNum}" data-part="${metadata.chapterPart}">${metadata.title}</h1>
                <div class="no-break"><i>Tác giả:</i> ${metadata.description}</div>
                <div class="no-break"><i>Chủ đề:</i> ${metadata.topic}</div>
            </div>
            <div class="chapter-number">
                <h3 class="no-break">Ngày thứ</h3>
                <h1 class="no-break">${metadata.chapterNum}</h1>
                ${chapterPartHtml}
            </div>
        </div>
        `;
        output += `${chapterCover} ${html} `;
        console.log('Done!');
    }
}

const result = template.replace(/{%content%}/g, output);

fs.writeFileSync('./public/index.html', result);
