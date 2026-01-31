import mdToRtfPlugin from "main";


const DEFAULT_FONT = "Calibri";
const DEFAULT_HIGLIGHT_COLOR = " ;\\red255\\green255\\blue0;";
const DEFAULT_FONT_SIZE = "\\fs32";
const DEFAULT_OBSIDIAN_LIGHT_THEME_TEXT_COLOR = "rgb(34, 34, 34)";
const DEFAULT_OBSIDIAN_DARK_THEME_TEXT_COLOR = "rgb(218, 218, 218)";



interface textHeadingData{
    headingSize: string,
    headingColor: string,
}



export default class RtfHeader{
    public static rtfFontSize: string = ""
    public static obsidianFontSize: string = "";
    public static textHeadings: textHeadingData[] = []; 
     // textHeadings[1] = Heading 1 data..
     // textHeadings[2] = Heading 2 data..
     // etc...
    public static isHighlightTextColor = false;

    public static setRtfHeader(): string{

        this.rtfFontSize = this.getFontSize();
        this.obsidianFontSize = this.getObsidianFontSize();
        this.findTextHeadingsData();
        

        let finishedHeader: string = 
         "{\\rtf1\\ansi\\ansicpg1252\\deff0\\nouicompat\n" +
         "{\\fonttbl{\\f0\\fnil\\fcharset0 INSERT_FONT;}}\n" +
         "{\\colortblINSERT_COLORS}\n" +
         "{\\*\\generator .md-to-.rtf Converter plugin for obsidian!}\\viewkind4\\uc1\n" +
         "\\pard\\f0INSERT_DEFAULT_FONT_SIZE\n";
    
        finishedHeader = finishedHeader.replace("INSERT_FONT", this.getObsidianVaultFont());
        finishedHeader = finishedHeader.replace("INSERT_COLORS", this.setHeaderColors());
        finishedHeader = finishedHeader.replace("INSERT_DEFAULT_FONT_SIZE", this.rtfFontSize);
    


        return finishedHeader;
    }



    private static setHeaderColors():string{
     //Header colors guide:
     //1 (first element rtf starts with in the color table) = highlight color
     //2 = highlight TEXT color
     //3 - 7 = Headings 1 - 5 colors
     //8 = bold text color
        let finalColorString = "";
        //First going to set the highlight color
        finalColorString += this.getHighlightColor();
        finalColorString += this.getHighlightTextColor();

        for(let i = 1; i <= 5; i++){
            finalColorString += this.textHeadings[i]?.headingColor;
        }

        return finalColorString.replace(/; ;/g, ";"); 
         //Since we appended colors together, and their formatting is ;color here;
         //We could end up with "; ;", which could break the rtf..

    }



    public static getATextHeadingData(index: number): textHeadingData{
        return this.textHeadings[index] ?? this.defaultTextHeadingData();
    }

    public static defaultTextHeadingData(): textHeadingData{
        return {headingSize: DEFAULT_FONT_SIZE, headingColor: " ;\\red0\\green0\\blue0;"};
    }



    private static probeForNewStyledElement(elementName: string): HTMLElement{
         //Not my code originally. Modified it and used it for what I needed.
         //We use this for ANY element we can't get a global varible on...
        const probe = document.createElement(elementName);

        probe.style.position = "absolute";
        probe.style.visibility = "hidden";
        probe.style.pointerEvents = "none";

        return document.body.appendChild(probe);
    }

    private static deleteNewStyledElementProbe(probe: HTMLElement){
        probe.remove();
    }





    private static findTextHeadingsData(){
        //We're expecting 5 heading levels for a default stock obsidian vault. 

        for(let i = 1; i <= 5; i++){
            
            let newTextHeadingData: textHeadingData = this.defaultTextHeadingData();
            
            let textHeadingFontSize = getComputedStyle(document.body).getPropertyValue("--h"+i+"-size");
            let adjustedFontSize = parseFloat(textHeadingFontSize) * parseFloat(this.obsidianFontSize);
                //actual font size = em * normal font size in px
            newTextHeadingData.headingSize = this.convertToRtfFontSize(adjustedFontSize.toString());
            

            
            let textHeadingColorElement = this.probeForNewStyledElement("h"+i);
            let color = getComputedStyle(textHeadingColorElement).color;
            color = color.replace(/[ ()rgba]/g, "");
            color = this.checkForDarkThemeColors(color);
            color = this.convertToRtfColor(color.split(","));
            newTextHeadingData.headingColor = color;
            //also check if when no style is applied if default regular colors (Expecting blacks and whites)
            //are present in rtf header...

            this.textHeadings[i] = newTextHeadingData;
            this.deleteNewStyledElementProbe(textHeadingColorElement);
        }

    }

    private static checkForDarkThemeColors(color: string): string{
        //Stock obsidian dark theme has a color for headings that can be hard to read in a white background
        //of an rtf. So we're setting it to black as default.

        if(color == "218,218,218")
            return "0,0,0";
        else
            return color;


    }


    private static fontError(){
        mdToRtfPlugin.newErrorNotice("Could not find a valid font.", "");
    }
    private static getObsidianVaultFont(): string{
        const editorEl = document.querySelector('.cm-content') as HTMLElement;
            //".cm-content" is the css class responsible for styling the main content of a markdown note file
        if(editorEl){
            const computedStyle = window.getComputedStyle(editorEl);
            const fontFamilyString = computedStyle.fontFamily;

            return this.deduceToSingularFont(fontFamilyString);
        }else{
            this.fontError();
            return DEFAULT_FONT;
        }
    } 
    private static deduceToSingularFont(fontFamilyString: string): string{
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
    private static cleanUpFont(font: string): string{
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

    private static getFontSize(): string{
        let fontSize = getComputedStyle(document.body).getPropertyValue("--font-text-size")
        if(fontSize === "" || fontSize === undefined) return DEFAULT_FONT_SIZE; 

        let convertedSize: string = this.convertToRtfFontSize(fontSize);
        return convertedSize;

    }

    private static getObsidianFontSize(): string{
        return getComputedStyle(document.body).getPropertyValue("--font-text-size");
    }

    private static convertToRtfFontSize(fontSize: string): string{
        
      return "\\fs" + (Math.round(parseFloat(fontSize)*2)).toString();  

    }




    private static getHighlightColor(): string{

        const highlightEl = this.probeForNewStyledElement("mark");
        let color = window.getComputedStyle(highlightEl).backgroundColor;

        if(color === "rgba(0, 0, 0, 0)" || color === undefined){
            color = DEFAULT_HIGLIGHT_COLOR;
            this.deleteNewStyledElementProbe(highlightEl);
            return color;
        }

        color = color.replace(/[ ()rgba]/g, ""); 
        let rgbValue: string[] = color.split(",");

        rgbValue = this.addHighlightOffset(rgbValue);
        color = this.convertToRtfColor(rgbValue);
         //Gets the highlight color of the vault from global varible. (Which by default is an rgba,
         //however, we just ignore the alpha by simply not using it here, cause RTF can't use alpha value.)
         //(It looks something like (255, 255, 255, 0.1), so program gets replaces any space characters with nothing. )
         //Splits the different color values, then gets styilized into proper RTF format.
        this.deleteNewStyledElementProbe(highlightEl);
        return color;
    }

    private static addHighlightOffset(rawHighlightColor: string[]): string[] {
        //Purpose of this method is that rtf doesn't have an alpha value
        //so this method is to try and emulate that by just adding an offset to make the text lighter.

        let offset = 20; // This method's purpose is to make it LIGHTER not darker, so it is recommended to keep offset to a positive integer number.
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

    private static convertToRtfColor(color: string[]): string{
        return " ;\\red"+ color[0] + "\\green"+ color[1] + "\\blue"+ color[2] +";"
    }

    private static getHighlightTextColor(): string{

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

        let highlightEl = this.probeForNewStyledElement("mark");
        let hightlightTextColor = getComputedStyle(highlightEl).color;

        if(hightlightTextColor == DEFAULT_OBSIDIAN_DARK_THEME_TEXT_COLOR || hightlightTextColor == DEFAULT_OBSIDIAN_LIGHT_THEME_TEXT_COLOR){
            this.isHighlightTextColor = false;
            return ";\\redUNDEFINED\\greenUNDEFINED\\blueUNDEFINED;";
        }
           

        hightlightTextColor = hightlightTextColor.replace(/[ ()rgba]/g, "");
        this.isHighlightTextColor = true;
        this.deleteNewStyledElementProbe(highlightEl);
        return this.convertToRtfColor(hightlightTextColor.split(","));
    }

}