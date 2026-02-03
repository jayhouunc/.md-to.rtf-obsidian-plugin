import Notices from "notices";
import GeneralNoteData from "converter/general-note-data";



const DEFAULT_FONT = "Calibri";
const DEFAULT_HIGLIGHT_COLOR = " ;\\red255\\green255\\blue0;";
const DEFAULT_OBSIDIAN_LIGHT_THEME_TEXT_COLOR = "rgb(34, 34, 34)";
const DEFAULT_OBSIDIAN_DARK_THEME_TEXT_COLOR = "rgb(218, 218, 218)";


export default class RtfHeader{


    public setRtfHeader(): string{

        
        let finishedHeader: string = 
         "{\\rtf1\\ansi\\ansicpg1252\\deff0\\nouicompat\n" +
         "{\\fonttbl{\\f0\\fnil\\fcharset0 INSERT_FONT;}}\n" +
         "{\\colortblINSERT_COLORS}\n" +
         "{\\*\\generator .md-to-.rtf Converter plugin for obsidian!}\\viewkind4\\uc1\n" +
         "\\pard\\f0INSERT_DEFAULT_FONT_SIZE\n";
    
        finishedHeader = finishedHeader.replace("INSERT_FONT", this.getObsidianVaultFont());
        finishedHeader = finishedHeader.replace("INSERT_COLORS", this.setHeaderColors());
        finishedHeader = finishedHeader.replace("INSERT_DEFAULT_FONT_SIZE", GeneralNoteData.rtfFontSize);
    


        return finishedHeader;
    }



    private setHeaderColors():string{
     
        let finalColorString = "";

        finalColorString += this.getHighlightColor();
        finalColorString += this.getHighlightTextColor();

        for(let i = 1; i <= 5; i++){
            finalColorString += GeneralNoteData.textHeadings[i]?.headingColor;
        }

        return finalColorString.replace(/; ;/g, ";"); 
         //Since we appended colors together, and their formatting is ;color here;
         //We could end up with "; ;", which could break the rtf..
    }

    private fontError(){
        Notices.newErrorNotice("Could not find a valid font. Using default font: " + DEFAULT_FONT, "");
    }
    private getObsidianVaultFont(): string{
        const editorEl = document.querySelector('.cm-content') as HTMLElement;
        if(editorEl){
            const computedStyle = window.getComputedStyle(editorEl);
            const fontFamilyString = computedStyle.fontFamily;

            return this.deduceToSingularFont(fontFamilyString);
        }else{
            this.fontError();
            return DEFAULT_FONT;
        }
    } 
    private deduceToSingularFont(fontFamilyString: string): string{

        fontFamilyString = fontFamilyString.replace(/["?\uFFFD]/g, "");
         //Rids the string of any ",? or unknown characters

        let listOfFonts: string[];
        listOfFonts = fontFamilyString.split(",");


        let correctFont: string = "";

        for(const font of listOfFonts){
            if(font === "" || font === " ")
                continue;

            correctFont = this.cleanUpFont(font);
            break;  
        }

        if(correctFont == undefined || correctFont == "") return DEFAULT_FONT;
        else return correctFont;
        
    }
    private cleanUpFont(font: string): string{

        let finalFontStringArray: string[] = Array.from(font); 
        let ffsa_index: number = 0; //'ffs' = finalFontStringArray
        let trueIndex: number = 0;
        
        for(let index = 0; index < font.length;){

            if(font[index] !== " ")
                break;
                
            if(font[index] === " "){
                trueIndex++;
                index++;
                continue;
            }                
        }

        do{
            finalFontStringArray[ffsa_index] = font[trueIndex] ?? "";
            ffsa_index++;
            trueIndex++;
        }while(font[ffsa_index] != undefined);
        
        return finalFontStringArray.join("");
    }


    




    private getHighlightColor(): string{

        const highlightEl = GeneralNoteData.probeForNewStyledElement("mark");
        let color = window.getComputedStyle(highlightEl).backgroundColor;

        if(color === "rgba(0, 0, 0, 0)" || color === undefined){
            color = DEFAULT_HIGLIGHT_COLOR;
            GeneralNoteData.deleteNewStyledElementProbe(highlightEl);
            return color;
        }

        color = color.replace(/[ ()rgba]/g, ""); 
        let rgbValue: string[] = color.split(",");

        rgbValue = this.addHighlightOffset(rgbValue);
        color = GeneralNoteData.convertToRtfColor(rgbValue);
        GeneralNoteData.deleteNewStyledElementProbe(highlightEl);
        return color;
    }

    private addHighlightOffset(rawHighlightColor: string[]): string[] {

        let offset = 20; //Positive integer number expected. 
        
        let offsettedHighlightColor: number[] = rawHighlightColor.map(Number);

        for(let i = 0; i < offsettedHighlightColor.length; i++){
            
            let element = offsettedHighlightColor[i];
            if(element === undefined)
                return rawHighlightColor;
            
            element = Math.min(element + offset, 255); 
            offsettedHighlightColor[i] = element;
        }

        return offsettedHighlightColor.map(String);
        

    }


    private getHighlightTextColor(): string{

        //If there is a highlight text color used by a user, then we'll use that 
        //if it can't find it, then we wont..
        //we need to do it this way because ALL colors are needed to be defined in the header
        //and we can't just leave it out if a color doesn't exist..
        //so if it's default aka no defined highlight text color by user
        //we'll set the highlight text color's data in the header to something arbitrary but signals that space
        //won't be used (";\\redUNDEFINED\\greenUNDEFINED\\blueUNDEFINED;";)
        //and then we'll set a boolean to false, to signify it in text-styling.ts to not add formatting to 
        //use any color for text when in a highlight block..
        //however, if there is a highlight text color
        //of course we get the color, set it in the header, and set the boolean to true, signifying to text-styling.ts
        //it can use it...

        let highlightEl = GeneralNoteData.probeForNewStyledElement("mark");
        let hightlightTextColor = getComputedStyle(highlightEl).color;

        if(hightlightTextColor == DEFAULT_OBSIDIAN_DARK_THEME_TEXT_COLOR || hightlightTextColor == DEFAULT_OBSIDIAN_LIGHT_THEME_TEXT_COLOR)
            return ";\\redUNDEFINED\\greenUNDEFINED\\blueUNDEFINED;";
           

        hightlightTextColor = hightlightTextColor.replace(/[ ()rgba]/g, "");
        GeneralNoteData.deleteNewStyledElementProbe(highlightEl);
        return GeneralNoteData.convertToRtfColor(hightlightTextColor.split(","));
    }

}