
export const DEFAULT_FONT_SIZE = "\\fs32";


export interface TextHeadingData{
    headingSize: string,
    headingColor: string,
}

export default class GeneralNoteData{

    public static rtfFontSize: string = ""
    public static obsidianFontSize: string = "";
    private static textHeadings: TextHeadingData[] = []; 
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
            newTextHeadingData.headingColor = this.convertToRtfColor(color.split(","));


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
        if(color == "218,218,218") return "0,0,0";
        else return color;
    }

    public static convertToRtfColor(color: string[]): string{
        return " ;\\red"+ color[0] + "\\green"+ color[1] + "\\blue"+ color[2] +";"
    }
    



    public static probeForNewStyledElement(elementName: string): HTMLElement{
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