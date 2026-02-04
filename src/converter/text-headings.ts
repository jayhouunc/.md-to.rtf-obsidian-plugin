import GeneralNoteData from "./general-note-data";

export default class TextHeadings{

  
    public static doTextHeadingsConversion(lineToEdit: string): string{

        if(lineToEdit.startsWith("#"))
            return this.convertHeading(lineToEdit, this.findHeadingNumber(lineToEdit));
        else
            return lineToEdit;

    }

    private static findHeadingNumber(lineToEdit: string): number{

        let headingNumber: number = 0;
        for(let i = 0; i < 5; i++){
            if(lineToEdit[i] == "#")
               headingNumber++;
        }

        return headingNumber;

    }

    private static convertHeading(lineToEdit: string, headingNumber: number): string{

        let headingStyleCharacters: string = "";

        for(let i = 0; i < headingNumber;i++){
            headingStyleCharacters+="#"
        }


        lineToEdit = lineToEdit.replace(headingStyleCharacters, this.replacerString(headingNumber));
         
        lineToEdit += " \\cf0" + GeneralNoteData.rtfFontSize; //Adding this to the end to signal end of styling in rtf..
        return lineToEdit;
    }

    private static replacerString(headingNumber: number): string{
        return GeneralNoteData.getATextHeadingData(headingNumber).headingSize + "\\cf" + (headingNumber + 2);
    }




}