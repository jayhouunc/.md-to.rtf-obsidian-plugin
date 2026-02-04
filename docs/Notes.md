# Overview

What all of the code does, is broken down into these steps:
- Load user settings (if any).
- Save user settings.
- Check for user click on an md file and give option "convert note to rtf" in the 'file-menu' in obsidian.
  - Check for user click on option "convert note to rtf" and converts note to an rtf file.
  - File is converted and placed in directory specified by user in settings. 

95% of the code is based on handling the conversion from obsidian's markdown styling as it's shown in reading view, to rtf formatting. 


# main.ts

This file handles the initial setup and general backbone of the plugin, as well as the actual start of the plugin logic. 
*(The user clicking on a menu on an markdown note and clicking the option "convert note to rtf")*
## Main execution flow
*(This is most of main.ts)*

At the start of the main class is a call to the settings on "settings/settings.ts"
```ts
public mdToRtfSettings: Settings = new Settings();
```

In this file, at the top is the "folderPathSetting" interface.
```ts
interface folderPathSetting{
  directoryPath: string;
  keyForAccurateDirectory: number;
}
```

It is called into a new variable at the start of the class.
```ts
export default class Settings{
	public folderPathSetting: folderPathSetting;
```

Reason for this interface is because I made a user setting for the plugin that allows the user to pick where they want a future converted file to go to.
There's 3 choices..
- The Desktop
- Same exact place as the original note 
- A custom directory

The program needs to know the actual directory, no matter where or what it is, but first it needs to know how it will find it. 

The way the program will know how to find it, is by a small "key" system I implemented.
Which is as follows:
```ts
//-1 = error/undefined/something went wrong
// 0 = the desktop (default)
// 1 = same place as the note
// 2 = other place specified by user
```

So whenever the user has determined where the directory for the converted file will be. The program will be able to find it according to the key, every time a note file is converted. 



The program uses this key system everytime a note is clicked by the user to be converted. 
Why I chose to do it like this is because of these reasons: 
- The potential setting "same place as the note."
   *There's no way to figure that out unless a note is actually being converted.* 
- Needing a clean way to validate a directory. 
  *Like for instance.. 
  Trying to validate a directory path as a user is typing it. (When option 3 is selected.) 
  Or...
  Validating a path to the desktop DIRECTLY in settings-ui.ts. (When option 1 is selected.) 
  I found to be inefficient. 
  So throwing an error right as the user tries to convert a note, seemed to me to be a clean way to validate any directory.*

Now how the program gets there is through a small execution flow. 
1. The next major block in the default exported class...
   ```ts
   async onload(){
		this.loadSettings();
		this.registerEvent(
			this.app.workspace.on('file-menu', (menu: Menu, file:TFile) =>{
				if(file instanceof TFile && file.extension === "md")
					this.addMenuItems(menu, file);
			})
		);
	}
   ```
*(Any time a file menu exists (aka clicked) and it was clicked on a file that is a markdown file, it will add the option "convert note to rtf")*
↓
2. The "addMenuItems()" method.
   ```ts
	private addMenuItems(menu: Menu, file: TFile){
		menu.addItem((item) =>{
			item.setTitle("⠀Convert note to RTF");
			item.onClick(async () =>{
				Notices.newNotice("Converting note to RTF.....");
				this.conversionOfFileToRTF(file);
			});
		});
	}
   ```
*(Any time the option "convert note to rtf" is clicked, start conversion of clicked file)*
↓
3. The "conversionOfFileToRTF()" method.
   ```ts
    private async conversionOfFileToRTF(file: TFile){
        if(this.findAccurateDirectoryBasedOnValue(
        this.mdToRtfSettings.folderPathSetting.keyForAccurateDirectory, file) === -1)
            return;
   ```
*(before conversion happens, find the directory)*
↓
4. Finally finding the directory via "findAccurateDirectoryBasedOnKey()" method.
   ```ts
	private findAccurateDirectoryBasedOnKey(key: number, file: TFile): boolean{
		switch(key){
			case 0:
				return this.checkForValidDesktopBeforeSaving();
			case 1:
				return this.setCurrentClickedOnFileDirectory(this.app, file);
			case 2:
				return this.checkValidDirectoryPath(
				this.mdToRtfSettings.folderPathSetting.directoryPath);
			default:
				Notices.newErrorNotice(
				"Invalid option for folder path setting. ", "");
				return false;
		}
	}
   ```


That is how the key system works and is executed. 

## checkAndSetDefaultFolderPath() method

This checking to see if the default folder path exists because if a user has named their desktop something else, the program won't be able to find it since the default folder path is set to the desktop. 
*(Which was also made flexible to any operating system when declared.)*

This method is specifically ran at the start of the plugin whenever the settings (if any) are loaded.
If program can not find the desktop and set the default folder path to it, program will continue on with the path labeled "undefined" unless set by user.
This is so when "undefined" is encountered later in the program *(e.g. when program is trying to do the conversion from .md to .rtf)*, it will not continue and will prompt the user to set a valid path.  


Also, you may notice that the program isn't in fact saving it. *(There is no saveSettings() method call here.)*
That means yes, every time plugin is reloaded, obsidian is reloaded, etc...
if the user has not set a directory path, the program will keep setting the data in the folderPathSetting to the defaults no matter what, cause the program can't tell if it was user set, or was left untouched by the user since it's default anyway.

```ts
private async checkAndSetDefaultFolderPath(){
	this.mdToRtfSettings.folderPathSetting = Object.assign({}, await 
	this.loadData());
	
	if(this.mdToRtfSettings.folderPathSetting.keyForAccurateDirectory > 0)
		return;
		//Stops the check right here if the user has already set the folder path
		//to something else besides default.
		//(As stated above in the interface declaration. 
		//"0 = Desktop (Default), -1 = undefined/error")
		
	if(fs.existsSync(DEFAULT_FOLDERPATH_SETTING.directoryPath)){
		this.mdToRtfSettings.folderPathSetting = Object.assign({}, 
		DEFAULT_FOLDERPATH_SETTING);
		//Will assign the default folder path. (As the desktop, 
		//if program can find the path to the desktop.)
	}else{
		this.mdToRtfSettings.folderPathSetting = Object.assign({}, 
		UNDEFINED_FOLDERPATH_SETTING);
		Notices.newErrorNotice("Could not set a default directory path." 
		"Please manually set one to avoid errors!", "");
		//Will assign undefined folder path setting to folder path setting if 
		//default (dekstop) directory could not be found.
	}
}
```

# settings/settings-ui.ts 

This is where the actual logic of the user settings for the plugin is deliberately handled, which main.ts will be using. 

Where the logic starts is in the display() method inherited from "PluginSettingTab" obsidian provides.
*(This is explained in-depth obsidian's official developer docs on how to make user settings. 
All we really have to do here is just extend that class, and use everything from there to create our plugin's settings.)*
↓
```ts
display(): void {
	const {containerEl} = this;
	containerEl.empty();
	
	this.createAllBaseOptions();
}
```
*(.createAllBaseOptions() method is just a wrapper for all "Base options" to be created.
Meaning any options a user would just see by default at first install without clicking anything.)*

```ts
private createAllBaseOptions(): void{
	this.createDirectoryPicker();
}
```
The main settings for the md-to-rtf converter plugin is essentially just changing the directory where converted file is printed to.
Hence the name and the method "createDirectoryPicker()"
↓
```ts
private createDirectoryPicker(){
	new Setting(this.containerEl)
	 .setName('Destination of converted files')
	 .setDesc('This is the folder where the notes you converted from markdown" 
	 "(.md) to rich text format (.rtf) are stored.")
	 .addDropdown((dropdown) =>
		dropdown
		.addOption('0', "The Desktop.")
		.addOption('1', "Same place as original note.")
		.addOption('2', "Other. (Custom directory. Please specify below.)")		
		.setValue(this.savedValueHandling(
		this.plugin.mdToRtfSettings.folderPathSetting.keyForAccurateDirectory
		.toString()))
		 .onChange(async (value) =>{
			this.pickedValueHandeling(value);
		})
	);
}
```
The directory picker is a dropdown menu in the settings tab of the plugin in obsidian.
Main thing to look at here is in the ".setValue()" method call and the ".onChange()" method call.

.setValue() method is setting the value before any user change here. 
Which should be either a default or a saved value which was loaded on initialization in "main.ts", and that requires a tiny bit of extra handling via the .savedValueHandling() method
```ts
private savedValueHandling(value: string): string{
	if(value === '2')
		this.createCustomDirectoryOption();

	return value;
}
```
Reason why this is here is to check if user has previously chosen the 3rd option *"Other. (Custom directory. Please specify below.)"*
This allows program to both create the custom directory option if it's needed and then returning the previously saved user value to give to .setValue() method
⠀
⠀
⠀
.onChange() method is an event that takes the value the user picked from the dropdown, and puts it into .pickedValueHandling() method for handling. 
↓
```ts
private async pickedValueHandling(value: string){
	this.plugin.mdToRtfSettings.folderPathSetting.keyForAccurateDirectory = 
	parseInt(value);
	await this.plugin.saveSettings();

	switch(value){
		case '0':
			this.deleteCustomDirectoryOption();
			this.plugin.checkForValidDesktopBeforeSaving();
			break;
		case '1':
			this.deleteCustomDirectoryOption();
			this.plugin.mdToRtfSettings.folderPathSetting.directoryPath = "";
			await this.plugin.saveSettings();
			break;
		case '2':
			this.plugin.mdToRtfSettings.folderPathSetting.directoryPath = "";
			this.createCustomDirectoryOption();
			break;
}
```

If user selects "0" *(The desktop)*
Program will set it to the desktop but will check to see if it's valid and display an error to user if not.
*(This method is also used when user clicks to try and convert note despite their desktop not being valid. It was efficient to use it here as well since they I needed the exact same thing, just in different points of the program)*

If user selects "1" *(same directory as original note)*
The directory path is set to "" because at the moment the program doesn't don't know which note it should be looking for.
Therefore, the program will have to wait for the user to actually click on a note and press the ".md-to.rtf" button
so it can find its directory... *(as was explained prior in main.ts section)*

If user selects "2" *(Other. Please specify below)*
The directory path is set to "" again by default and program goes to ".createCustomDirectoryOption()" method so user can choose their directory for the note to be put into.
- *This is also why ".deleteCustomDirectoryOption()" method exists in every other option's case in the switch statement...*
```ts
	private deleteCustomDirectoryOption(): void{
		this.containerEl.empty();
		this.createAllBaseOptions();
	}
```
- The purpose for this logic is because any time the 3rd option *"Other. (Custom directory. Please specify below.)"* is selected, a new option will appear under the "directory picker" option allowing them to input their custom directory.
  However, the program shouldn't keep the custom directory option alive if user choses another option. So it will need to be rid of.
  ⠀
- How the program will get rid of it is by deleting the whole container element *(where all the options are stored)*, then re-create the all the base options *(including "directory picker" option)* anytime another option other than the 3rd option is chosen by the user. 
  ⠀ ⠀
- Of course, if 3rd option is picked, then it will create the custom directory option...

↓
```ts
private createCustomDirectoryOption(){
	new Setting(this.containerEl)
	.setName("Custom Directory: ")
	.setDesc("Please write out FULL PATH (from top-level directory). NOT local!")
	.addText(async (text) =>{
		text
		 .setPlaceholder("")
		 .setValue(this.plugin.mdToRtfSettings.folderPathSetting.directoryPath)
		 .onChange((value) =>{
			this.plugin.mdToRtfSettings.folderPathSetting.directoryPath = value;
			this.plugin.saveSettings();
		 })
	})
}
```
 No matter what the user types it will be saved and program will be checking if what the user typed is a valid path in "main.ts" when user tries to convert a note.
 There will throw an error if it isn't a valid path.


# converter/conversion-logic-handler.ts 

This is the main file that handles all the conversion logic. 
This is where the main meat of the plugin is. How it's built is by putting together all the different "modules" that handle every part of conversion.

These "modules" *(more like different typescript files)* would handle one thing each.
One takes care of text styling... One takes care of headings and how they're styled... One takes care of setting up the rtf file...

The conversion-logic-handler is the central hub for it all to take place. The decisive point where conversion begins whenever the user actually clicks on a file to be converted to rtf.
*Specifically, the .convert() method here in the conversion-logic-handler.*
```ts 
public async convert(inputFilePath: string, outputFilePath: string){
	...
	...
	...
	let endFile: string = "\n}";
	try{
		fs.writeFileSync(outputFilePath, RtfHeader.setRtfHeader() + "" 
		+ await this.setRtfContent(inputFilePath) + endFile, 'utf-8');
		  
		Notices.newNotice(`Successfully created RTF file
		at ${outputFilePath}`);
	}catch(error){
		Notices.newErrorNotice('Error writing RTF file:', error);
	}
}
```
*Where it is called in main.ts*
```ts
private async conversionOfFileToRTF(file: TFile){
	...
	...
	conversionHandeler.convert(inputFilePath, outputFilePath);

}
```
↓

I chose to break it up this way because RTF files have 3 distinct parts to be valid.
1. A Header *(This is where all the data the RTF file will use is defined here. Things such as colors, fonts, etc..)*
2. A body *(The actual readable content of the RTF file.)*
3. An end *(Just the ending bracket after the content has been written to signal the end of the RTF file.)*

The logic for determining the header is explained in-depth in the section "converter/rtf-header.ts".

The logic for determining the rtf body is in the following execution flow.
starting with the ".setRtfContent()" method...
```ts
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
```

From the markdown file the user has clicked to be converted, the program is going to read it line by line and push the edited *(correctly formatted to rtf)* version of the line to the finalizedContent sequentially. 
It adds to the end of each edited a "\line" control word. *(Makes it a new line in RTF)* 
As well as an actual new line character. *(This makes it so that whenever the RTF file is read in a text editor, everything isn't on one singular line)*
↓
Lastly, how the line is edited all happens within the ".handeLine()" method.
```ts
public handleLine(currentLine: string): string{
	
	ConversionLogicHandler.isEmptyLine = this.checkForEmptyLine(currentLine);
	
	let finalEditedLine = currentLine;
	
	//Add new "modules" below.
	finalEditedLine = TextHeadings.doTextHeadingsConversion(finalEditedLine);
	
	return finalEditedLine;
}
```

Every single line goes through here to be converted to proper rtf formatting, which is handled by different modules that edit the line, and return it back so that another module can edit it, and so on and so forth until the line has been converted.


Also.
`ConversionLogicHandler.isEmptyLine = this.checkForEmptyLine(currentLine);`

Why this particular logic for handling empty lines exists is because some stylings *(e.g.. an italic styling or a bold styling..)* potentially can carry over into other lines, so if the line is empty, the program shouldn't style it.

I found this to be the most efficient since conversion-logic-handler is cause every module essentially is an extension of this central hub.


# Explanation of RTF headers

Before explaining converter/rtf-header.ts and converter/general-note-data.ts. An explanation of RTF headers is needed.

The header of an RTF file is at the very top of the file. How RTF works is everything it is going to use in the file, **is defined here.** 
The font, the colors, the font size, formatting rules.. etc.
It all starts here.

Here is a basic header of an RTF file:
```rtf
{\rtf1\ansi\ansicpg1252\deff0\nouicompat
{\fonttbl{\f0\fnil\fcharset0 Tahoma;}}
{\colortbl ;\red255\green255\blue170;\red0\green0\blue0;\red255\green0\blue175;}
{\*\generator .md-to-.rtf Converter plugin for obsidian!}\viewkind4\uc1
\pard\f0\fs32
```

Everything in RTF lives inside of what's called groups.
(These brackets "{ }" )
The the starting bracket defines the group that is the entire document. Without this group defined, RTF wouldn't know what to look for and the file would not be valid. 
It will be closed at the absolute end of the rtf file.

*(This is the "}" defined and lightly referenced in conversion-logic-handler.ts)*
```ts
let endFile: string = "\n}";
```
*("\n" is just there to again make it easier to read in text editors)*

RTF uses "control words" to determine functionality.
They start with a "\", then a specific keyword, such as "b0" or "highlight".

I will now be going over each control word defined in this header in order from left to right, top to bottom.
- `\rtf1`
	This defines the RTF version. It is required and is required at the start. Without it the file might not be valid. 
	Version 1 is the standard and is used the most.
- `\ansi`
	Tells RTF to use ANSI encoding rules. Almost always present in RTF files.
- `\ansicpg1252`
	Ansi code page. 
	This matters for non-unicode fallback characters. Tells RTF what to use in case this happens.
	"1252" is the standard for Latin-1 (English + Western European)
- `\deff0`
	The default font. 
	This is set to the first font in the font table, but if there isn't any. It will default to whatever is the default font set by an RTF reader. 
- `\nouicompat`
	No older word UI compatibility.
	This tells RTF to render the file with modern rules and not previous outdated behavior.
⠀
⠀
- ```rtf
  {\fonttbl
  {\f0\fnil\fcharset0 Tahoma;}
	}
  ```
	This is the font table. *As defined by the control word "/fonttbl*
	It defines all fonts used in the document and it has to be in it's own group. 
	As well as every font defined, has to be in it's own group.
	
	`\f0` - Font index 0. It's defined here as such, but it is also referenced later in the same way with the same control word.
	*(So if there were another font, it would be defined as "\f1" and used in the rtf body as "\f1")*
	
	`\fnil` - Is the font family. Here it is set to null *"nil"* . If you have the font family, use it, if not, nil is okay to use.
	
	`\fcharset0 Tahoma;` - Default character set *(which is referenced as "0")*. It will tell RTF that this font uses regular ANSI characters.
	What comes direct after this, is the name of the font. Which in this case is 'Tahoma'. 
	The semicolon ends the font definition.
	
	
	So, whenever the RTF file uses Tahoma, it will be referencing this entry in the font table, by the control word "/f0"
⠀
⠀
- ```rtf
	{\colortbl 
	 ;\red255\green255\blue170;
	 \red0\green0\blue0;
	 \red255\green0\blue175;
	 \red255\green66\blue196;
	 \red255\green109\blue209;
	 \red255\green152\blue223;
	 \red255\green195\blue236;
	}
  ```
	This is the color table, it defines all colors to be used by the RTF file. 
	Any color based control word, such as "/highlight" or "/cf" references this color table. 
	
	This is straight forward, every color starts and ends with a ; and uses control words to define RGB values.
	
	So an rgb(255,255,255) is defined as ;/red255/green255/blue255;
⠀
⠀
- `\*\generator` 
	" \ * " is the "optional" control word. This is not required for a valid RTF file. 
	"\generator" just indicates what created the file. It is basic metadata. 
- `\viewkind4`
	Tells any rtf viewer what kind of view mode it will be using. 
- `\uc1`
	"After every "\uN", skip 1 fallback character"
	Example: "\u9744?"
	9744 = The unicode character
	? = The fallback character *(in case it doesn't work)*
	
	If it works, \uc1 tells RTF to skip the fallback character "?"
	if it doesn't, then of course the fallback character is inserted instead of nothing or some type of error potentially.
	
	This requires a bit of context to fully understand.
	For starters, this is essentially something left over from early RTF. Earlier in that time RTF was regular 8 bit text, meaning no characters could be generated.
	However, as time grew, unicodes became a thing, and RTF needed to be able to support it in case it ran into these unicode characters and didn't have a way to use them.
	.
	How unicodes are used in rtf: *(and a lot of places)*
	`\u1234`
	When rtf sees that, it will treat it as a control word, and if unicodes are supported, it will insert the unicode according to that code. 
	Problem was, if for some reason it couldn't be understood by the rtf reader, it would ignore it or break the RTF file. 
	Hence why after every \u control word, there needs to be a fallback character
	`\u1234?`
	
	This is behavior is correctly signaled to be used when it is defined in the header by stating`\uc1`
	
- `\pard\f0\fs32`
	Technically this is the start of the body, however I use it as part of the header because it sets up the defaults of the rtf anyways.
	`\pard` = "Paragraph default." Meaning starts a default paragraph
	`\f0` = Font 0. First font as defined in the font table.
	`\fs32` = Font size. ==In RTF font size is divided by 2 because RTF uses text size in "half-points". So really this is stating the font size to be 16. ==
	*(This is important to keep in mind to avoid confusion.)*


RTF is not markup, it’s a **state machine**.
Control words **change state**, text **inherits state**, groups **scope state**.
This is why everything to be used in the file has to be defined in the header. 




# converter/general-note-data.ts

Most if not every module needs to know some data before doing their conversions. 
Data like the size of a heading, the font of the note.. etc..
This data has to be accessed more than once throughout the plugin's code so it can be used in either control words for rtf or to be used in creating complex logic..

"general-note-data.ts" just contains functions and logic on how to determine this data. *("conversion-logic-handler.ts" still maintains the role of piecing together how this data is used in all of it's "modules" however..)*


The main method ".findGeneralNoteData()" in this file is where it all starts, and is executed when program is set to convert in conversion-logic-handler.ts
```ts
public async convert(inputFilePath: string, outputFilePath: string){
        GeneralNoteData.findGeneralNoteData();
        ...
        ...
```


## findTextHeadingsData() 

This method gets the color and the size of an obsidian heading.

This data, that has been converted into rtf control words, using this method, is packaged into an interface object called "TextHeadingData."
```ts
export interface TextHeadingData{
    headingSize: string,
    headingColor: string,
}
```

The data is accessed by an array created with this interface as a type, and the way it's accessed is intuitive indexing.
```ts
private static textHeadings: TextHeadingData[] = [];
```
Meaning..
`textHeadings[1]` = Heading 1 data..
`textHeadings[2]` = Heading 2 data..
and so on.
⠀⠀⠀⠀⠀*This is used in the method ".getATextHeadingData()":*
```ts
	public static getATextHeadingData(index: number): TextHeadingData{
		return GeneralNoteData.textHeadings[index] ?? 
		GeneralNoteData.defaultTextHeadingData();
	}
```
⠀⠀⠀⠀*Decided that any text heading data should be accessed in this way because it is cleaner...*
⠀⠀⠀⠀ *(It handles the "undefined" potential error)*



```ts
private static findTextHeadingsData():TextHeadingData[]{
	
	let finalTextHeadingsData: TextHeadingData[] = [];
	
	for(let i = 1; i <= 5; i++){
		let newTextHeadingData: TextHeadingData = this.defaultTextHeadingData();
		
		
		let textHeadingFontSize = 
		getComputedStyle(document.body).getPropertyValue("--h"+i+"-size");
		
		let adjustedFontSize = parseFloat(textHeadingFontSize) * 
		parseFloat(this.obsidianFontSize);
		
		newTextHeadingData.headingSize = 
		this.convertToRtfFontSize(adjustedFontSize.toString());
		
		
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
```

### For loop overview
```ts
for(let i = 1; i <= 5; i++){
...
```
We expect 5 heading levels for a default stock obsidian vault, so starting with 1 incrementing up to 5, the program will find each heading's color and size.

Each one from each iteration is stored in a temporary variable set to a default 
```ts
let newTextHeadingData: TextHeadingData = this.defaultTextHeadingData();
```
*(the default text heading is just a TextHeading with its size set to the DEFAULT_FONT_SIZE and its color set to ";\red0\green0\blue0;" black as a default.)*
.
At the end of each iteration the temporary variable is set to the temporary array
`let finalTextHeadingsData: TextHeadingData[] = [];` 
corresponding to it's current index. 
*(So "finalTextHeadingsData[2]" would have the data of an obsidian level 2 heading)*

At the end of the entire method, the temporary array finalTextHeadingsData is returned, allowing it to be set to the actual textHeadings array that is publicly accessed. 
```ts
...
return finalTextHeadingsData;
```


### For loop detailed breakdown

Finding the heading font size:
```ts
let textHeadingFontSize = getComputedStyle(document.body)
.getPropertyValue("--h"+i+"-size");
```
The data from obsidian that handles the headings sizes are global variables. They can be returned normally using those web api methods.
However,
other data, like the color, isn't a global variable, and can't be returned normally. Therefore needing a "probe." *(Explained in "probeForNewStyledElement()" sub-section.)*


```ts
let adjustedFontSize = parseFloat(textHeadingFontSize) * parseFloat(this.obsidianFontSize);
```
"adjustedFontSize" = em *(from --hx-size)* * *px (from obsidian font size)*


```ts
newTextHeadingData.headingSize = 
this.convertToRtfFontSize(adjustedFontSize.toString());
```
Sets the heading size of the temporary TextHeading variable to the adjusted font size, but converted to rtf format in ".convertToRtfFontSize()" method. 
*(All this does is convert the data into an rtf control word, and the 2x multiplication to the font size needed for rtf as mentioned in "Explanation of RTF Headers section")*


Finding the heading color:
```ts
let textHeadingColorElement = this.probeForNewStyledElement("h"+i);
let color = getComputedStyle(textHeadingColorElement).color;
```
This data needs a "probe" *(Explained in "probeForNewStyledElement()" sub-section.)* because obsidian doesn't have a global heading color variable.
The color is then found from the probe as normal.

```ts
color = color.replace(/[ ()rgba]/g, "");
```
Cleans up the color a little bit. Takes it from "rgba(12, 34, 56, 0.1)" to "12,34,56,0.1"

```ts
color = this.checkForDarkThemeColors(color);
```
↓
```ts
private static checkForDarkThemeColors(color: string): string{
	if(color == "218,218,218") return "0,0,0";
	else return color;
}
```
This check is needed because stock obsidian dark theme has a color for headings that can be hard to read in a white background of an rtf. 
So in the method it is set to black as default if this color from the obsidian dark theme is detected.

```ts
newTextHeadingData.headingColor = this.convertToRtfColor(color.split(","));
```
Sets the heading color of the temporary TextHeading variable to the color, but converted to rtf format in ".convertToRtfColor()" method. 


## probeForNewStyledElement() 

This method is used for ANY element we can't get a global variable on...
Makes a new 'probe' or a new, invisible, barebones HTML element to exist as if it were being rendered by obsidian.

Some variables are global in obsidian, meaning they just exist even if user hasn't typed anything
on a note. (E.g font size.)

While others require the user to actually type something in a note (E.g custom themes.)

```ts
public static probeForNewStyledElement(elementName: string): HTMLElement{
	
	const probe = document.createElement(elementName);
	
	probe.style.position = "absolute";
	probe.style.visibility = "hidden";
	probe.style.pointerEvents = "none";
	
	return document.body.appendChild(probe);
}
```

## deleteNewStyledElementProbe()
Every probe made has to be deleted eventually of course, otherwise it stays on the note indefinitely. 
It's just needed to find data and then is ought to be removed.
```ts
public static deleteNewStyledElementProbe(probe: HTMLElement){
	probe.remove();
}
```




# converter/rtf-header.ts 

This is the file that defines the RTF header.

I chose to define header everytime a file is clicked to be converted *(in "conversion-logic-handler.ts" in the convert() method as previously mentioned.)* instead of just one time at the start of plugin because user could change styles *(which directly determines the color table in the header)* or some kind of important data in-between each conversion..

## Header colors guide
*(1 starts at the first element in the color table)* 

1 = *Highlight color*
2 = *Highlight TEXT color*
3 - 7 = *Headings 1 - 5 colors*
8 = *Bold text color*


## Main execution flow
Everything starts from the "setRtfHeader()" method. 
```ts
public static setRtfHeader(): string{
	
	let finishedHeader: string =
	 "{\\rtf1\\ansi\\ansicpg1252\\deff0\\nouicompat\n" +
	 "{\\fonttbl{\\f0\\fnil\\fcharset0 INSERT_FONT;}}\n" +
	 "{\\colortblINSERT_COLORS}\n" +
	 "{\\*\\generator .md-to-.rtf Converter plugin for" 
	 "obsidian!}\\viewkind4\\uc1\n" +
	 "\\pard\\f0INSERT_DEFAULT_FONT_SIZE\n";
	
	finishedHeader = finishedHeader.replace("INSERT_FONT", 
	this.getObsidianVaultFont());
	
	finishedHeader = finishedHeader.replace("INSERT_COLORS", 
	this.setHeaderColors());
	
	finishedHeader = finishedHeader.replace("INSERT_DEFAULT_FONT_SIZE", 
	GeneralNoteData.rtfFontSize);
	
	
	return finishedHeader;
}
```

The finished header is the full skeleton of the header for the RTF file, just with all the actual useable data marked with temporary words.
The program can just insert the data by replacing the temporary words once it has been located using the methods...

## Finding the font execution flow
1. .getObsidianVaultFont() 
```ts
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
```

```ts
const editorEl = document.querySelector('.cm-content') as HTMLElement;
```
".cm-content" is the css class, being used as an html element, is responsible for styling the text on all text, therefore it contains the font family *(which contains the font)* used by obsidian note files.

```ts
if(editorEl){
...
	return this.deduceToSingularFont(fontFamilyString);
}else{
	this.fontError();
	return DEFAULT_FONT;
}
```
If the element exists this is where the code will take place,
however if it doesn't for some reason, an error will be shown to the user and the default font will be used instead.
↓

2. .deduceToSingularFont() 
```ts
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
```
This is needed because program is isolating the "font-family" attribute of ".cm-content"
"font-family" has a whole list of fonts to use, it will go through them in line if there isn't a valid one.
This method is just getting the first valid one. *(If it isn't nothing or empty)*
```ts
correctFont = this.cleanupFont(font)
```
This is needed to clean up the font even further, as the exact element from the previous
array could look like: *"  font-name here"*. It needs to look like **"font-name here"**
↓

 3. .cleanUpFont() method
```ts
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
```

```ts
let finalFontStringArray: string[] = Array.from(font);
```
Just need this to initialize and have it be similar in length to the font string.
This will be overwritten shortly.

```ts
...
let trueIndex: number = 0;

for(let index = 0; index < font.length;){
	if(font[index] !== " ")
		break;
		
	if(font[index] === " "){
		trueIndex++;
		index++;
		continue;
}
```
If program finds an actual character that isn't a blankspace it will break,
however if it does, it will increment the true starting index for use to reference
when the program actually does find a non blankspace character.


```ts
do{
	finalFontStringArray[ffsa_index] = font[trueIndex] ?? "";
	ffsa_index++;
	trueIndex++;
}while(font[ffsa_index] != undefined);
```
This code just assigns the new array to the font "array" *(which is a string that is treated as an array)* but at the "true index". AKA, the part of the font that contains actual characters and not whitespace.

Program of course does this character by character. *(Hence why I felt it was best to use a string treated as an array.)*

The do while loop stops when the end of the font "array" is found.


```ts
return finalFontStringArray.join("");
```
Converts the array into a string. Then replaces all "," characters from that conversion
into nothing. *(This is needed cause it will do "T,e,s,t, ,S,e,n,t,a,n,c,e")*.
Finally, returns the properly cleaned up font.




## Finding color table execution flow

setHeaderColors() method
```ts
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
```

### getHighlightColor() execution flow
```ts
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
```
 Gets the highlight color of the vault from global variable. 
 Which by default is an rgba, however, we just ignore the alpha by simply not using it here, cause RTF can't use alpha value.
 *(It looks something like "rgb( 255 , 255 , 255 , 0.1 )". so program gets replaces any space characters with nothing. )*
 Program then splits the different color values, then it gets stylized into proper RTF format.
 ↓
.addHighlightOffset()
 ```ts
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
 ```
Purpose of this method is that because rtf doesn't have an alpha value, this method here is to try and emulate that by just adding an offset to make the text lighter. 
The color before it is converted to rtf is passed in as a string array.
Red representing element 0, Green element 1, and Blue element 2.

```ts
let offset = 20; 
```
It is recommended to keep offset to a positive integer number as to make the color **LIGHTER** not darker.


```ts
	for(let i = 0; i < offsettedHighlightColor.length; i++){
		let element = offsettedHighlightColor[i];
		if(element === undefined)
			return rawHighlightColor;
	...
```

This is needed to check if the element actually exists or not. Will throw an error if something like this isn't in place..

However, this shouldn't happen because program checked if the data that went into the array was valid or not. *(In getHighlightColor() method.)*

So if it is undefined, something went wrong with typescript its self. Some kind of library or something else was set wrong...

Program will just return the rawHighlightColor as it was passed in, unedited IF this happens.

```ts
		...
		element = Math.min(element + offset, 255);
		offsettedHighlightColor[i] = element;
	}
	return offsettedHighlightColor.map(String);
```
Otherwise, program will edit the elements in loop by adding the offset and truncating it if it exceeds 255 *(max value for an rgb.)*
Sets it to the temporary array, and lastly returns the new color converted back to a string. 

### getHighlightTextColor()

This method sets the color of the text used when anything is highlighted in rtf.
If there is a highlight text color set by user theme, then program will find it, convert it to rtf formatting and use it.
```ts
private getHighlightTextColor(): string{
	let highlightEl = GeneralNoteData.probeForNewStyledElement("mark");
	
	let hightlightTextColor = getComputedStyle(highlightEl).color;
	
	if(hightlightTextColor == DEFAULT_OBSIDIAN_DARK_THEME_TEXT_COLOR 
	|| hightlightTextColor == DEFAULT_OBSIDIAN_LIGHT_THEME_TEXT_COLOR)
		return ";\\redUNDEFINED\\greenUNDEFINED\\blueUNDEFINED;";
		
	hightlightTextColor = hightlightTextColor.replace(/[ ()rgba]/g, "");
	GeneralNoteData.deleteNewStyledElementProbe(highlightEl);
	return GeneralNoteData.convertToRtfColor(hightlightTextColor.split(","));
}
```

```ts
if(hightlightTextColor == DEFAULT_OBSIDIAN_DARK_THEME_TEXT_COLOR 
|| hightlightTextColor == DEFAULT_OBSIDIAN_LIGHT_THEME_TEXT_COLOR)
	return ";\\redUNDEFINED\\greenUNDEFINED\\blueUNDEFINED;";
```
This exists because if the highlight text color is found to be default *(aka no defined highlight text color by user.)*
The program will set the highlight text color's data to something arbitrary but signals that space
won't be used *(";\\redUNDEFINED\\greenUNDEFINED\\blueUNDEFINED;")*

# converter/text-headings.ts
This file contains the code on how text headings conversion works. 

The main execution flow starts with the "doTextHeadingsConversion()" method. 
```ts
public static doTextHeadingsConversion(lineToEdit: string): string{
	if(lineToEdit.startsWith("#"))
		return this.convertHeading(lineToEdit, this.findHeadingNumber(lineToEdit));
	else
		return lineToEdit;
}
```
No matter what, obsidian *(and really markdown files in general)* only do headings when the "#" character is at the start of the line.*( '#' Is the character in markdown files that signify a heading.)*

So if the line begins with a "#" character. The conversion will begin, otherwise the method will just return back the line unedited.
↓
```ts
private static findHeadingNumber(lineToEdit: string): number{
	
	let headingNumber: number = 0;
	
	for(let i = 0; i < 5; i++){
		if(lineToEdit[i] == "#")
		   headingNumber++;
	}
	
	return headingNumber;
}
```
For each heading level, it corresponds to the number of "#" characters present. 
A level 5 heading will have 5 "#"'s, a level 3 will have 3... and so on..

If a character is found, it will increase the heading number, and return it.
This will signify what text heading style to use. 
↓
```ts
private static convertHeading(lineToEdit: string, headingNumber: number): string{
	
	let headingStyleCharacters: string = "";
	
	for(let i = 0; i < headingNumber;i++){
		headingStyleCharacters+="#"
	}
	
	lineToEdit = lineToEdit.replace(headingStyleCharacters,
	this.replacerString(headingNumber));
	
	lineToEdit += " \\cf0" + GeneralNoteData.rtfFontSize; 
	return lineToEdit;
}
```
Once the heading number is found, it is passed into the convertHeading() method.
This method constructs a string based on the heading number using a for loop.
```ts
let headingStyleCharacters: string = "";

for(let i = 0; i < headingNumber;i++){
	headingStyleCharacters+="#"
}
```

This string will be used to replace the corresponding string within the line with the rtf control words responsible for styling the text heading. 
```ts
lineToEdit = lineToEdit.replace(headingStyleCharacters,this.replacerString(headingNumber));
```

The control word "\cf0" means "Color the font as the 1st index (0) in the color table".
This along with the normal fontsize is added to the end to signal end of styling this heading in rtf..
```ts
ineToEdit += " \\cf0" + GeneralNoteData.rtfFontSize;
```
↓

```ts
private static replacerString(headingNumber: number): string{
	
	return GeneralNoteData.getATextHeadingData(headingNumber).headingSize 
	+ "\\cf" + (headingNumber + 2);
	 
}
```

The control words are inserted here.
Program is using the heading size from the corresponding TextHeading that was defined in "general-note-data.ts".
However the heading color is used independently in the header, so to actually use it it needs to be referenced by the element number in the rtf header.

`(this.headingNumber + 2)`
*Have to offset it by 2 cause highlighter color is 1 and highlight text color is 2 in the color table..*