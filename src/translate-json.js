// translate-json.js  ---  Command line tool to translate a JSON file by using Google Translation.

// Copyright (c) 2021 Marco Parrone

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

const args = require('minimist')(process.argv.slice(2));
const prompt = require('prompt');
const fs = require('fs');
const { Translate } = require('@google-cloud/translate').v2;

// Write jsoncontent in the outdir/name.json file. 
//
async function writeJsonFileInDir(jsoncontent, outdir, name) {
    fs.writeFile(outdir + '/' + name + '.json', JSON.stringify(jsoncontent), err => {
        if (err) {
            console.error('ERROR: Cannot write file: ' + err.code + ' ' + err.message)
            process.exit(1);
        }
    });
}

// Translate inputjson in target language and write the output in the outdir directory.
//
// The "translate" argument must contain the intialized Google Translate object.
//
async function writeTranslatedJsonFileInDir(inputjson, outdir, target, translate) {
    let i = 0;
    let messages = [];
    let keys = [];
    let outputjson = {};
    let translations = [];
    // Collect all the messages in an array, and the respective keys in another array.
    for (let elem in inputjson) {
        messages[i] = inputjson[elem];
        keys[i] = elem;
        i++;
    }
    try {
        // Translate the messages array.
        [translations] = await translate.translate(messages, target);
    } catch (err) {
        console.error('ERROR: Cannot translate to ' + target + ': ' + err.code + ' ' + err.message);
        process.exit(1);
    } finally {
        // Create the output json.
        for (let j = 0; j < keys.length; j++) {
            outputjson[keys[j]] = translations[j];
        }
        // Write the output json.
        writeJsonFileInDir(outputjson, outdir, target);
    }
}

// Save the list of the supported languages in outdir/translations.json, 
// translate inputjson in all the supported languages, and write the output files
// in the outdir directory, by naming them "outdir/language.json".
//
// The "translate" argument must contain the intialized Google Translate object.
//
async function writeTranslatedJsonFilesInDir(inputjson, outdir, translate) {
    let languages = [];
    try {
        [languages] = await translate.getLanguages();
    } catch (err) {
        console.error('ERROR: Cannot get supported languages: ' + err.code + ' ' + err.message);
        process.exit(1);
    } finally {
        writeJsonFileInDir(languages, outdir, 'translations');
        languages.forEach(language => { writeTranslatedJsonFileInDir(inputjson, outdir, language.code, translate) });
    }
}

// Parse the arguments, check the paths, ask for the API key, and do the translations.
//
function main() {
    let inputjson = {}; // input JSON file content
    let translate = {}; // translate object

    // Parse the arguments
    if (!args['infile'] || !args['outdir'] || !args['target']) {
        console.log('usage: npx @marcoparrone/translate-json --infile=<INPUTFILE> --outdir=<OUTPUTDIR> --target=<language-code|all> \n\
example: npx @marcoparrone/translate-json --infile=src/en.json --outdir=public/i18n/ --target=all \n\
\n\
In this example, the list of the supported languages would be saved in public/i18n/languages.json (it is saved only with the option --target=all), \
the src/en.json file would be translated in all the supported languages, and the translations would be saved in public/i18n/languagecode.json \
(for example, public/i18n/it.json, etc...).');
    } else {

        // Check for the specified file and directory: eventually it's better to fail before doing the translation.

        if (!fs.existsSync(args['outdir'])) {
            console.error('ERROR: output directory does not exist: ' + args['outdir']);
            process.exit(1);
        }
        if (!fs.existsSync(args['infile'])) {
            console.error('ERROR: input file does not exist: ' + args['infile']);
            process.exit(1);
        }

        if (!fs.lstatSync(args['outdir']).isDirectory()) {
            console.error('ERROR: output directory is not a directory: ' + args['outdir']);
            process.exit(1);
        }

        if (!fs.lstatSync(args['infile']).isFile()) {
            console.error('ERROR: input file is not a file: ' + args['infile']);
            process.exit(1);
        }

        // Read the input file.        
        fs.readFile(args['infile'], 'utf8', (err, data) => {
            if (err) {
                console.error('ERROR: Cannot read file: ' + err.code + ' ' + err.message)
                process.exit(1);
            }
            // Ask the user for the his Google Cloud Platform API key,
            // tell him that he will eventually pay for the translations.
            console.log('Please insert your Google Cloud Platform API key for using Google Translate. \n\
The translations will be eventually billed on your account - check with Google for terms and conditions. \n');
            prompt.start();
            prompt.get([{ name: 'key', hidden: true }], function (err, result) {
                if (err) {
                    console.error('ERROR: Cannot read prompt: ' + err.code + ' ' + err.message);
                    process.exit(1);
                } else {
                    // Do the requested translations.
                    try {
                        translate = new Translate({ 'key': result.key });
                    } catch (err) {
                        console.error('ERROR: Cannot initialize Google Translate: ' + err.code + ' ' + err.message);
                        process.exit(1);
                    } finally {
                        inputjson = JSON.parse(data);
                        if (args['target'] === 'all') {
                            writeTranslatedJsonFilesInDir(inputjson, args['outdir'], translate);
                        } else {
                            writeTranslatedJsonFileInDir(inputjson, args['outdir'], args['target'], translate);
                        }
                    }
                }
            });
        });
    }
}

// Call the main function.
main();