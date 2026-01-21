
export default class conversionLogic{

    public stylingStates: Record<string, boolean> = {
        "isInHighlightBlock": false,
        "isInBoldBlock": false,
    }
    
    isEmptyLine: boolean = false;

    constructor(){}

    public convertLine(currentLine: string): string{
        this.isEmptyLine = this.checkForEmptyLine(currentLine);

        let finalEditedLine = currentLine;
 

        finalEditedLine = this.findTextStyling(finalEditedLine, "=" , "\\highlight1", "\\highlight0", "isInHighlightBlock")
        finalEditedLine = this.findTextStyling(finalEditedLine, "*" ,"\\b", "\\b0", "isInBoldBlock")
       
        return finalEditedLine;
    }


    private checkForEmptyLine(currentLine: string): boolean{
        return /^[ ]*$/.test(currentLine)
    }



    public findTextStyling(currentLine: string, obsidianSytlingChar: string, entry: string, exit: string, stylingState: string){
        let tempstring: string[] = Array.from(currentLine); 
         //Even if the line has no text styling, this temp string is set to the current line passed in, so when it's returned it won't be edited.


        if (this.stylingStates[stylingState] === undefined) {
            console.warn(`${stylingState} not found`);
        }

        if(this.isEmptyLine && this.stylingStates[stylingState]){
            tempstring[0] = exit;
            this.stylingStates[stylingState] = false;
            return tempstring.toString().replace(/[,]/g, "");
        } 


        for(let i = 0; i < currentLine.length; i++){

            if(tempstring[i+1] == undefined)
                break;

            if(tempstring[i] == obsidianSytlingChar && tempstring[i+1] == obsidianSytlingChar && !this.stylingStates[stylingState]){
                tempstring[i] = entry;
                tempstring[i+1] = " "
                this.stylingStates[stylingState] = true;
                continue;
            }

            if(tempstring[i] == obsidianSytlingChar && tempstring[i+1] == obsidianSytlingChar && this.stylingStates[stylingState]){
                tempstring[i] = exit
                tempstring[i+1] = " "
                this.stylingStates[stylingState] = false;
                continue;
            }

        }
        
        return tempstring.toString().replace(/[,]/g, "");

    }



}