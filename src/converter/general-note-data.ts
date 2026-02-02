
export const DEFAULT_FONT_SIZE = "\\fs32";


export interface TextHeadingData{
    headingSize: string,
    headingColor: string,
}

export default class GeneralNoteData{

    public static rtfFontSize: string = ""
    public static obsidianFontSize: string = "";
    public static textHeadings: TextHeadingData[] = []; 
     // textHeadings[1] = Heading 1 data..
     // textHeadings[2] = Heading 2 data..
     // etc...




    public static findGeneralNoteData(){
        this.rtfFontSize = this.getRtfFontSize();
        this.obsidianFontSize = this.getObsidianFontSize();
        this.textHeadings = this.findTextHeadingsData();
    }





    private static getRtfFontSize(): string{
        //Font size needs to be found from obsidian, and converted into rtf format.
        let fontSize = getComputedStyle(document.body).getPropertyValue("--font-text-size")
        if(fontSize === "" || fontSize === undefined) return DEFAULT_FONT_SIZE; 

        let convertedSize: string = this.convertToRtfFontSize(fontSize);
        return convertedSize;

    }

    private static getObsidianFontSize(): string{
        return getComputedStyle(document.body).getPropertyValue("--font-text-size");
    }

    public static convertToRtfFontSize(fontSize: string): string{
      return "\\fs" + (Math.round(parseFloat(fontSize)*2)).toString();  
    }



    private static findTextHeadingsData():TextHeadingData[]{
        //We're expecting 5 heading levels for a default stock obsidian vault. 

        let finalTextHeadingsData: TextHeadingData[] = [];

        for(let i = 1; i <= 5; i++){
            
            let newTextHeadingData: TextHeadingData = this.defaultTextHeadingData();
            
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

            finalTextHeadingsData[i] = newTextHeadingData;
            this.deleteNewStyledElementProbe(textHeadingColorElement);
        }

        return finalTextHeadingsData;

    }

    public static getATextHeadingData(index: number): TextHeadingData{
        return GeneralNoteData.textHeadings[index] ?? GeneralNoteData.defaultTextHeadingData();
    }

    public static defaultTextHeadingData(): TextHeadingData{
        return {headingSize: DEFAULT_FONT_SIZE, headingColor: " ;\\red0\\green0\\blue0;"};
    }

    private static checkForDarkThemeColors(color: string): string{
        //Stock obsidian dark theme has a color for headings that can be hard to read in a white background
        //of an rtf. So we're setting it to black as default.

        if(color == "218,218,218")
            return "0,0,0";
        else
            return color;


    }

    public static convertToRtfColor(color: string[]): string{
        return " ;\\red"+ color[0] + "\\green"+ color[1] + "\\blue"+ color[2] +";"
    }
    



    public static probeForNewStyledElement(elementName: string): HTMLElement{
         //Used for ANY element we can't get a global varible on...
         //Makes a new 'probe' or a new fake element to exist as if it were being rendered by obsidian.
         //Some varibles are global in obsidian, meaning they just exist even if user hasn't typed anything on a note. (E.g font size.)
         //While others require the user to actually type something in a note (E.g custom themes.)
        const probe = document.createElement(elementName);

        probe.style.position = "absolute";
        probe.style.visibility = "hidden";
        probe.style.pointerEvents = "none";

        return document.body.appendChild(probe);
    }

    public static deleteNewStyledElementProbe(probe: HTMLElement){
        probe.remove();
    }


    

    








}