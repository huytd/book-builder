import fs from 'fs'
import { marked } from 'marked';
import fm from 'front-matter';
import hljs from 'highlight.js';

const template = fs.readFileSync('./templates/page.html', 'utf-8')

marked.setOptions({
    highlight: function(code, lang) {
        const language = hljs.getLanguage(lang) ? lang : 'plaintext';
        return hljs.highlight(code, { language }).value;
    },
    smartLists: true,
    smartypants: true
});

let output = "";
const contentFolder = "./content";
const files = fs.readdirSync(contentFolder);
for (let file of files) {
    if (file.endsWith(".md")) {
        console.log("Processing", file);
        const markdown = fs.readFileSync(contentFolder + "/" + file, 'utf-8');
        const { attributes, body } = fm(markdown);
        const html = marked(body);
        const metadata = {
            title: (attributes as any)['title'],
            description: (attributes as any)['description'],
            chapterNum: (attributes as any)['chapterNum'],
        };
        const chapterCover = `
        <div class="chapter-cover">
            <div class="chapter-name">
                <h3 class="no-break">${metadata.description}</h3>
                <h1 class="no-break">${metadata.title}</h1>
            </div>
            <div class="chapter-number">
                <h3 class="no-break">Chapter</h3>
                <h1 class="no-break">${metadata.chapterNum}</h1>
            </div>
        </div>
        `;
        output += `${chapterCover} ${html} `;
        console.log("Done!");
    }
}

const result = template.replace(/{%content%}/g, output);

fs.writeFileSync('./public/index.html', result);


