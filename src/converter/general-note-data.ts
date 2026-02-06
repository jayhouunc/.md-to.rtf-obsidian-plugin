
export const DEFAULT_FONT_SIZE = "\\fs32";


interface TextHeadingData{
    headingSize: string,
    headingColor: string,
}

export interface ObsidianStyleData{
    name: string,
    sChar:string, //sChar means "Styling Character"
    numOfSCharsRequired: number,
    entry: string,
    exit: string,
}


export default class GeneralNoteData{

    public static rtfFontSize: string = "";
    public static obsidianFontSize: string = "";
    private static textHeadings: TextHeadingData[] = []; 
     // textHeadings[1] = Heading 1 data..
     // textHeadings[2] = Heading 2 data..
     // etc...
    public static obsidianStylesList: ObsidianStyleData[] = [];



    public static findGeneralNoteData(){
        this.rtfFontSize = this.getRtfFontSize();
        this.obsidianFontSize = this.getObsidianFontSize();
        this.textHeadings = this.findTextHeadingsData();
        this.buildObsidianStylesList(this.obsidianStylesList);
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
    


    private static buildObsidianStylesList(ObsidianStyleData: ObsidianStyleData[]){


        ObsidianStyleData[0] = this.newStyleData("italic", "*", 1, "\\i ", "\\i0 ");
        ObsidianStyleData[1] = this.newStyleData("italic", "_", 1, "\\i ", "\\i0 ");
        ObsidianStyleData[2] = this.newStyleData("bold", "*", 2, "\\b ", "\\b0 ");
        ObsidianStyleData[3] = this.newStyleData("bold", "_", 2, "\\b ", "\\b0 ");
        ObsidianStyleData[4] = this.newStyleData("bold-italic", "*", 3, "\\b \\i ", "\\b0 \\i0 ");
        ObsidianStyleData[5] = this.newStyleData("bold-italic", "_", 3, "\\b \\i ", "\\b0 \\i0 ");
        ObsidianStyleData[6] = this.newStyleData("strikethrough", "~", 2, "\\strike ", "\\strike0 ");
        ObsidianStyleData[7] = this.newStyleData("highlight", "=", 2, "\\highlight1 " , "\\highlight0 ");

    }

    private static newStyleData(name: string, sChar: string, numOfSCharsRequired: number, entry: string, exit:string):ObsidianStyleData{
        return {name, sChar, numOfSCharsRequired, entry, exit};
    }

    public static returnStyleData(sChar: string, numOfSCharsRequired: number): ObsidianStyleData{
        
        for(let data of this.obsidianStylesList){
            if(data.sChar == sChar && data.numOfSCharsRequired == numOfSCharsRequired)
                return data;
        }

      return this.undefinedStyleData();
    }

    private static undefinedStyleData(): ObsidianStyleData{
        return {name: "UNDEFINED", sChar: "", numOfSCharsRequired:-1, entry:"", exit:""}
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