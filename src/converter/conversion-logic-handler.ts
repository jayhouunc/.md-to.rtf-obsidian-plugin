
import GeneralNoteData from "./general-note-data";
import Notices from "notices";
import * as fs from 'fs';
import * as readLine from "readline";

import TextHeadings from "./text-headings";
import RtfHeader from "./rtf-header";
import TextStyling from "./text-styling";




export default class ConversionLogicHandler{

    public static isEmptyLine: boolean = false;
    public rtfHeader: RtfHeader;

 

    
    public async convert(inputFilePath: string, outputFilePath: string){
        
        GeneralNoteData.findGeneralNoteData();
        this.rtfHeader = new RtfHeader();
        

        let endFile: string = "\n}";

        try{
            fs.writeFileSync(outputFilePath, this.rtfHeader.setRtfHeader() + await this.setRtfContent(inputFilePath) + endFile, 'utf-8');
            Notices.newNotice(`Successfully created RTF file at ${outputFilePath}`);
        }catch(error){
            Notices.newErrorNotice('Error writing RTF file:', error);
        }


    }

    private checkForEmptyLine(currentLine: string): boolean{
        return /^[ ]*$/.test(currentLine)
    }


    

    private async setRtfContent(inputFilePath: string): Promise<string>{

        const rl = readLine.createInterface({
            input: fs.createReadStream(inputFilePath), 
            crlfDelay: Infinity,   
        });

        const finalizedContent: string[] = [];

        for await (const line of rl){
            finalizedContent.push(this.handleLine(line) + "\\line" + "\n");
        }

        return finalizedContent.join("");
    }


    private handleLine(currentLine: string): string{
        
        ConversionLogicHandler.isEmptyLine = this.checkForEmptyLine(currentLine);

        let finalEditedLine = currentLine; 

        //Add new "modules" below.
        finalEditedLine = TextHeadings.doTextHeadingsConversion(finalEditedLine);
        finalEditedLine = TextStyling.doTextStyling(finalEditedLine)
        
        
        return finalEditedLine;
    }


    
    


}