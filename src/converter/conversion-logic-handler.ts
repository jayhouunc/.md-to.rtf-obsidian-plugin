import RtfHeader from "./rtf-header";
import mdToRtfPlugin from "main";
import * as fs from 'fs';
import * as readLine from "readline";
import TextHeadings from "./text-headings";


export default class ConversionLogicHandler{

    public static isEmptyLine: boolean = false;
    

    constructor(){}


    public async convert(inputFilePath: string, outputFilePath: string){
        let endFile: string = "\n}";

        try{
            fs.writeFileSync(outputFilePath, RtfHeader.setRtfHeader() + "" + await this.setRtfContent(inputFilePath) + endFile, 'utf-8');
            mdToRtfPlugin.newNotice(`Successfully created RTF file at ${outputFilePath}`);
        }catch(error){
            mdToRtfPlugin.newErrorNotice('Error writing RTF file:', error);
        }


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


    public handleLine(currentLine: string): string{
        
        ConversionLogicHandler.isEmptyLine = this.checkForEmptyLine(currentLine);

        let finalEditedLine = currentLine; 

        //Add new "modules" below.

        let textHeadings:TextHeadings = new TextHeadings();       
        finalEditedLine = textHeadings.doTextHeadingsConversion(finalEditedLine);
        
        
        return finalEditedLine;
    }


    private checkForEmptyLine(currentLine: string): boolean{
        return /^[ ]*$/.test(currentLine)
    }




}