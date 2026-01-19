import mdToRtfPlugin from "main";
import * as fs from 'fs';

export default class ToRTFConverter{

    
    font: string;
    headerData: string;
    filePath: string;
    
    constructor(){}

    public convert(outputFilePath: string): void{
        this.filePath = outputFilePath;
        this.getObsidianVaultFont();
        this.headerData = this.setRtfHeader();

        let contentData: string = this.basicContentData();

        try{
            fs.writeFileSync(outputFilePath, this.headerData + "" + contentData, 'utf-8');
            mdToRtfPlugin.newNotice(`Successfully created RTF file at ${outputFilePath}`);
        }catch(error){
            mdToRtfPlugin.newErrorNotice('Error writing RTF file:' + error);
        }


    }

    private fontError(){
        mdToRtfPlugin.newErrorNotice("Could not find a valid font.");
    }
    private getObsidianVaultFont(){
        const editorEl = document.querySelector('.cm-content') as HTMLElement;
        if(editorEl){
            const computedStyle = window.getComputedStyle(editorEl);
            const fontFamilyString = computedStyle.fontFamily;

            this.deduceToSingularFont(fontFamilyString);
        }
    } 
    private deduceToSingularFont(fontFamilyString: string){
        /*
        This is needed because program is isolating the "font-family" attribute of ".cm-content"
        ("".cm-content" is the class used by obsidian on all text.)
        "font-family" has a whole list of fonts to use, it will go through them in line if there isn't a valid one.
        This program is just getting the first valid one.
        */



        fontFamilyString = fontFamilyString.replace(/["?\uFFFD]/g, "");
         //Rids the string of any ",? or unknown characters

        let listOfFonts: string[];
        listOfFonts = fontFamilyString.split(",");
        

        for(const font of listOfFonts){
            if(font === "" || font === " ")
                continue;

            this.font = this.cleanUpFont(font);
            break;
        }

        if(this.font === undefined || this.font === "")
            this.fontError();
    }
    private cleanUpFont(font: string): string{
        /*
        This is needed to clean up the font even further, as the exact element from the previous
        array could look like: "  font-name here". It needs to look like "font-name here"
        */

        let finalFontStringArray: string[] = Array.from(font); 
         //Just need this to initialize and have it be similar in length to the font string
         //This will be overwritten shortly.
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
             /*
             If program finds an actual character that isn't a blankspace it will break,
             however if it does, it will increment the true starting index for use to reference
             when the program actually does find a non blankspace character.
             */ 
                
        }

        do{
            finalFontStringArray[ffsa_index] = font[trueIndex] ?? "";
            ffsa_index++;
            trueIndex++;
        }while(font[ffsa_index] != undefined || null || "");
         /*
         This code just assigns the new array to the font "array" (which is a string that 
         is treated as an array) but at the "true index". AKA, the part of the font that contains
         actual characters and not whitespace.

         Program of course does this character by character. (Hence why I felt it was best to use a string treated
         as an array.)

         The while loop stops when the end of the font "array" is found.
         */


        let finalFontString = finalFontStringArray.toString();
        finalFontString = finalFontString.replace(/[,]/g, "");
        return finalFontString;
         //Converts the array into a string.Then replaces all "," characters from that conversion
         //into nothing. (This is needed cause it will do "T,e,s,t, ,S,e,n,t,a,n,c,e")
         //Finally, returns the properly cleaned up font. :)
    }

    private setRtfHeader(): string{
        let finishedHeader: string = 
         "{\\rtf1\\ansi\\ansicpg1252\\deff0\\nouicompat{\\fonttbl{\\f0\\fnil\\fcharset0 INSERT_FONT;}}\n" +
         "{\\colortblINSERT_HIGHLIGHT_COLOR}\n" +
         "{\\*\\generator .md-to-.rtf Converter plugin for obsidian!}\\viewkind4\\uc1\n";
    
        finishedHeader = finishedHeader.replace("INSERT_FONT", this.font);
        finishedHeader = finishedHeader.replace("INSERT_HIGHLIGHT_COLOR", this.getHighlightColor());

        return finishedHeader;
    }

    private getHighlightColor(): string{
       
        let color = getComputedStyle(document.body).getPropertyValue("--text-highlight-bg-rgb")
        color = color.replace(/[ ]/g, "");
        let rgbValue: string[] = color.split(",");
        rgbValue = this.addHighlightOffset(rgbValue);
        color = " ;\\red"+ rgbValue[0] + "\\green"+ rgbValue[1] + "\\blue"+ rgbValue[2] +";";
         //Gets the highlight color of the vault from global varible.
         //(It looks something like (255, 255, 255, 0.1), so program gets replaces any space characters with nothing. )
         //Splits the different color values, then gets styilized into proper RTF format.
        
        if(color === "" || color === undefined){
            mdToRtfPlugin.newErrorNotice("Couldn't find highlight color somehow.");

             //RTF still needs a highlight color, so if program can't find it for some reason, here's a default.
            color = " ;\\red255\\green255\\blue255;"
        }


        return color;
    }

    //old: {\colortbl ;\red255\green208\blue0;}
    //new: {\colortbl ;\red255\green218\blue10;}

    private addHighlightOffset(rawHighlightColor: string[]): string[] {
        //Purpose of this method is that rtf doesn't have an alpha value
        //so this method is to try and emulate that by just adding an offset to make the text lighter.

        let offset = 90;
        let offsettedHighlightColor: number[] = rawHighlightColor.map(Number);

        for(let i = 0; i < offsettedHighlightColor.length; i++){
            
            let element = offsettedHighlightColor[i];
            if(element === undefined || null)
                break;
             //This is needed to check if the element actually exists or not. Will throw an error if something like this isn't in place..
            
            if(element + offset > 255)
                element = 255;
            else
                element += offset;
             //This if else statement checks if the element (aka, the color value) will be over 255 when the offset is applied.)
             //If it is, just set the color value to 255, if it isn't, add the offset to the color value.

            offsettedHighlightColor[i] = element;

        }

        return offsettedHighlightColor.map(String);
        

    }

    private basicContentData(): string{
     return "\\pard\\highlight1\\f0\\fs22\\lang1033\\ THIS IS A TEST\\highlight0\n}";   
    }

}
