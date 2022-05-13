const PDFDocument = require('pdfkit');
const fs = require('fs');
const commonmark = require('commonmark');
const parser = new commonmark.Parser({ smart: true });

const doc = new PDFDocument({
    size: [2138, 3038],
    margins: {
        top: 160,
        bottom: 160,
        left: 160,
        right: 320
    },
    layout: 'portrait'
});
doc.pipe(fs.createWriteStream('output.pdf'));
doc.registerFont('Heading', './fonts/heading.ttf');
doc.registerFont('Body', './fonts/body.ttf');
doc.registerFont('Body Italic', './fonts/body-italic.ttf');
doc.registerFont('Body Bold Italic', './fonts/body-bolditalic.ttf');
doc.registerFont('Body Bold', './fonts/body-bold.ttf');
doc.registerFont('Mono', './fonts/mono.ttf');
doc.registerFont('Mono Bold', './fonts/mono-bold.ttf');

const renderChapterHeading = (chapterNumber, chapterName, subText) => {
    doc.font('Heading')
        .fontSize(60)
        .text(subText, 167, 727);

    doc.font('Heading')
        .fontSize(150)
        .text(chapterName, 160, 810, {
            width: 1300
        });

    doc.font('Heading')
        .fontSize(60)
        .text("Chapter", 1481, 727, {
            width: 340,
            align: 'right'
        });

    doc.font('Heading')
        .fontSize(300)
        .text(chapterNumber, 1481, 765, {
            width: 340,
            align: 'right'
        });
};

// renderChapterHeading(3, "Recursive Descent Parser", "Making sense of the tokens");

const renderText = (markdown) => {
    const parsed = parser.parse(markdown);
    const walker = parsed.walker();
    let event, node;
    while ((event = walker.next())) {
        node = event.node;
        if (event.entering) {
            // console.log("PROCESSING NODE TYPE " + node.type + " '" + node.literal + "'");
            switch (node.type) {
                case 'paragraph':
                case 'linebreak':
                case 'softbreak':
                    doc.text("\n");
                    break;
                case 'heading':
                    {
                        let size = 85;
                        if (node.level == 2) {
                            size = 70;
                        }
                        if (node.level == 3) {
                            size = 60;
                        }
                        const contentNode = walker.next()?.node;
                        doc.font('Heading')
                        .fontSize(size)
                        .text("\n" + contentNode.literal);
                    }
                    break;
                case 'text':
                    doc.font('Body')
                        .fontSize(48)
                        .text(node.literal, { continued: true, align: 'justify' });
                    break;
                case 'strong':
                    {
                        const contentNode = walker.next()?.node;
                        doc.font('Body Bold')
                        .fontSize(48)
                        .text(contentNode.literal, { continued: true, align: 'justify' });
                    }
                    break;
                case 'emph':
                    {
                        const contentNode = walker.next()?.node;
                        doc.font('Body Italic')
                        .fontSize(48)
                        .text(contentNode.literal, { continued: true, align: 'justify' });
                    }
                    break;
                case 'code':
                    doc.font('Mono')
                        .fontSize(40)
                        .moveUp(0.12)
                        .text(node.literal, { continued: true, align: 'justify' })
                        .moveDown(0.12);
                    break;
                default:
                    console.log("UNKNOWN NODE " + node.type);
                    break;
            }
        } else {
            if (node.type === "paragraph") {
                doc.font('Body').fontSize(48).text("\n");
            }
        }
    }
};

const lines = fs.readFileSync("./source.md", "utf-8").split("\n");

for (let line of lines) {
    renderText(line);
}

doc.end();

