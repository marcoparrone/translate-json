# translate-json

A command line tool to translate a JSON file by using Google Translation.

## Usage

```sh
npx @marcoparrone/translate-json --infile=<INPUTFILE> --outdir=<OUTPUTDIR> --target=<language-code|all>
```

## Example usage

```sh
npx @marcoparrone/translate-json --infile=src/en.json --outdir=public/i18n/ --target=all
```

In this example, the list of the supported languages would be saved in public/i18n/languages.json (it is saved only with the option --target=all), the src/en.json file would be translated in all the supported languages, and the translations would be saved in public/i18n/languagecode.json (for example, public/i18n/it.json, etc...).
