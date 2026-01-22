import mdToRtfPlugin from "main";
import conversionLogic from "conversionLogic";
import * as fs from 'fs';
import * as readLine from "readline";


const DEFAULT_FONT:string = "Calibri";
const DEFAULT_HIGLIGHT_COLOR = " ;\\red255\\green255\\blue255;";
const DEFAULT_FONT_SIZE = "32";
 //Rtf for some reason renders the font size as 2x the actual size. 
 //Meaning. If the font size is 20px, in the rtf it will need to be defined as 40.
 //So the actual default is half of the value put into the constant;

export default class ToRTFConverter{


    constructor(){}

    public async convert(inputFilePath: string, outputFilePath: string): Promise<void>{
        let endFile: string = "\n}";

        try{
            fs.writeFileSync(outputFilePath, this.setRtfHeader() + "" + await this.setRtfContent(inputFilePath) + endFile, 'utf-8');
            mdToRtfPlugin.newNotice(`Successfully created RTF file at ${outputFilePath}`);
        }catch(error){
            mdToRtfPlugin.newErrorNotice('Error writing RTF file:' + error);
        }


    }

    private async setRtfContent(inputFilePath: string): Promise<string>{

        let editedContent: string[] = [];
         //This is where the program stores every line from md file, into rtf format.
         //Each line is an element in an array.

        const rtfConversion: conversionLogic = new conversionLogic();

        const rl = readLine.createInterface({
            input: fs.createReadStream(inputFilePath), 
            crlfDelay: Infinity,   
        });

        const finalizedContent = new Promise<string>((resolve) => {
            rl.on("line", (line) =>{;
                editedContent.push(rtfConversion.convertLine(line) + "\\line " + "\n"); 
                 //New line "\n" doesn't show up in rtf, but it does in text editors, so it's helpful for debugging.
            })

            rl.on("close", () =>{
                return resolve(editedContent.join(""));
            })

        }) 

        return finalizedContent;
    }


    private setRtfHeader(): string{
        let finishedHeader: string = 
         "{\\rtf1\\ansi\\ansicpg1252\\deff0\\nouicompat{\\fonttbl{\\f0\\fnil\\fcharset0 INSERT_FONT;}}\n" +
         "{\\colortblINSERT_HIGHLIGHT_COLOR}\n" +
         "{\\*\\generator .md-to-.rtf Converter plugin for obsidian!}\\viewkind4\\uc1\n" +
         "\\pard\\f0\\fsINSERT_FONT_SIZE ";
    
        finishedHeader = finishedHeader.replace("INSERT_FONT", this.getObsidianVaultFont());
        finishedHeader = finishedHeader.replace("INSERT_HIGHLIGHT_COLOR", this.getHighlightColor());
        finishedHeader = finishedHeader.replace("INSERT_FONT_SIZE", this.getFontSize())

        return finishedHeader;
    }


    private fontError(){
        mdToRtfPlugin.newErrorNotice("Could not find a valid font.");
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
        }while(font[ffsa_index] != undefined);
         /*
         This code just assigns the new array to the font "array" (which is a string that 
         is treated as an array) but at the "true index". AKA, the part of the font that contains
         actual characters and not whitespace.

         Program of course does this character by character. (Hence why I felt it was best to use a string treated
         as an array.)

         The while loop stops when the end of the font "array" is found.
         */


       
        return finalFontStringArray.join("");
         //Converts the array into a string.Then replaces all "," characters from that conversion
         //into nothing. (This is needed cause it will do "T,e,s,t, ,S,e,n,t,a,n,c,e")
         //Finally, returns the properly cleaned up font. :)
    }

    private getFontSize(): string{
        let fontSize = getComputedStyle(document.body).getPropertyValue("--font-text-size")
        if(fontSize === "" || fontSize === undefined) return DEFAULT_FONT_SIZE; 

        let convertedSize: number = parseInt(fontSize) * 2;
        return convertedSize.toString();

    }



    private getHighlightColor(): string{
       
        let color = getComputedStyle(document.body).getPropertyValue("--text-highlight-bg-rgb")
        
        if(color === "" || color === undefined){
            mdToRtfPlugin.newErrorNotice("Couldn't find highlight color somehow.");

             //RTF still needs a highlight color, so if program can't find it for some reason, using the default;
            color = DEFAULT_HIGLIGHT_COLOR;
            return color;
        }
        
        color = color.replace(/[ ]/g, "");
        let rgbValue: string[] = color.split(",");
        
        rgbValue = this.addHighlightOffset(rgbValue);
        color = " ;\\red"+ rgbValue[0] + "\\green"+ rgbValue[1] + "\\blue"+ rgbValue[2] +";";
         //Gets the highlight color of the vault from global varible.
         //(It looks something like (255, 255, 255, 0.1), so program gets replaces any space characters with nothing. )
         //Splits the different color values, then gets styilized into proper RTF format.
        
        return color;
    }

    private addHighlightOffset(rawHighlightColor: string[]): string[] {
        //Purpose of this method is that rtf doesn't have an alpha value
        //so this method is to try and emulate that by just adding an offset to make the text lighter.

        let offset = 90; // This method's purpose is to make it LIGHTER not darker, so it is recommended to keep offset to a positive integer number.
        let offsettedHighlightColor: number[] = rawHighlightColor.map(Number);

        for(let i = 0; i < offsettedHighlightColor.length; i++){
            
            let element = offsettedHighlightColor[i];
            if(element === undefined)
                return rawHighlightColor;
             //This is needed to check if the element actually exists or not. Will throw an error if something like this isn't in place..
             //However, this shouldn't happen because program checked if the data that went into the array was valid or not. (In getHighlightColor() method.)
             //so if it is undefined, something went wrong with typescript its self. Some kind of library or something else was set wrong...
             //Program will just return the rawHighlightColor as it was passed in, unedited IF this happens.
            

            element = Math.min(element + offset, 255); //If the element (aka, the color value) will be over 255 when the offset is applied. Set it to 255. 
            offsettedHighlightColor[i] = element;

        }

        return offsettedHighlightColor.map(String);
        

    }

}
