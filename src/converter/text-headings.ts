/*
Rtf needs to have access to all colors and sizes it will use all throughout the file at the HEADER
hence why we did so much work in "rtf-header.ts" 

This file was where all the logic for handeling the styling in rtf whenever a text heading
is reached in obsidian..

*/


import GeneralNoteData from "./general-note-data";

export default class TextHeadings{

    headingNumber: number = 0;

    public doTextHeadingsConversion(lineToEdit: string): string{

        if(lineToEdit.startsWith("#")){
            this.findHeadingNumber(lineToEdit);
            return this.convertHeading(lineToEdit);

        }else
            return lineToEdit;

    }

    private findHeadingNumber(lineToEdit: string){

        for(let i = 0; i < 5; i++){
            if(lineToEdit[i] == "#")
                this.headingNumber++;
        }

    }

    private convertHeading(lineToEdit: string): string{

        let headingStyleCharacters: string = "";

        for(let i = 0; i < this.headingNumber;i++){
            headingStyleCharacters+="#"
        }


        lineToEdit = lineToEdit.replace(headingStyleCharacters, this.replacerString());
         
        lineToEdit += " \\cf0" + GeneralNoteData.rtfFontSize; //Adding this to the end to signal end of styling in rtf..
        return lineToEdit;
    }

    private replacerString(): string{
        return GeneralNoteData.getATextHeadingData(this.headingNumber).headingSize + "\\cf" + (this.headingNumber + 2);
         //(this.headingNumber + 2) Have to offset it by 2 cause highlighter color is 1 and highlight text color is 2 in the color table..
    }




}