import {App, PluginSettingTab, Setting} from "obsidian";
import mdToRtfPlugin from "./main";


export class mdToRtfPluginSettings extends PluginSettingTab {
	plugin: mdToRtfPlugin;

	constructor(app: App, plugin: mdToRtfPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;
		containerEl.empty();

		this.createDirectoryPicker();
	}

	private deleteCustomDirectoryOption(): void{

		/*
		The purpose for this logic is any time the 3rd option "Other. (Custom directory. Please specify below.)" is selected, 
		a new option will appear under the "directory picker" option, allowing them to input their custom directory.
		However, the program shouldn't keep the custom directory option alive if user choses another option. So it will need to be rid of.

		How the program will get rid of it is by deleting the whole container element (where all the options are stored), then 
		re-creating the "directory picker" option anytime the 3rd option for a custom directory is picked by user. 
		It will not create a loop because the only time the program deletes the whole container element and re-create the "directory picker"
		is on user changing a value. (An event.)

		That value would have to be the 3rd option 
		*/

		this.containerEl.empty();
		this.createDirectoryPicker();
	}

	private createCustomDirectoryOption(){
		new Setting(this.containerEl)
		.setName("Custom Directory: ")
		.setDesc("Please write out FULL PATH (from top-level directory). NOT local!")
		.addText(async (text) =>{
			text
			 .setPlaceholder("")
			 .setValue(this.plugin.folderPathSetting.directoryPath)
			 .onChange((value) =>{
				this.plugin.folderPathSetting.directoryPath = value;
				this.plugin.saveSettings();
				 //Don't worry we will be checking if what the user typed is a valid path in "main.ts" when user tries to convert a note.
				 //Program there will throw an error if it isn't a valid path.
			 })
		})
	}

	private createDirectoryPicker(){
		new Setting(this.containerEl)
		 .setName('Destination of converted files')
		 .setDesc('This is the folder where the notes you converted from markdown (.md) to rich text format (.rtf) are stored.')
		 .addDropdown((dropdown) =>
			dropdown
			.addOption('0', "The Desktop.")
			.addOption('1', "Same place as original note.")
			.addOption('2', "Other. (Custom directory. Please specify below.)") 
			 //".addOption" gives users options in the plugin settings to choose from. 1st perameter is actual value of option, 2nd perameter is display name of the option.
			.setValue(this.savedValueHandeling(this.plugin.folderPathSetting.keyForAccurateDirectory.toString()))
			 //Setting the value before any user change here. Which should be either a default or a saved value due to our check on initialization in "main.ts".
			 .onChange(async (value) =>{
				this.pickedValueHandeling(value);
			})
		);
	}

	private savedValueHandeling(value: string): string{
		/*
		This is here to check if user has previously chosen the 3rd option "Other. (Custom directory. Please specify below.)".
		So program can create the custom directory option and set it's saved value.
		
		Reason why this is in a method is because I couldn't just give instructions in the .setValue() method while setting the value.
		Which is what I needed.
		So I did both by putting both in a method.
		(Giving instructions, and returning the previously saved user value to give to .setValue() method.)
		*/

		if(value === '2')
			this.createCustomDirectoryOption();

		return value;

	}

	private async pickedValueHandeling(value: string){
		this.plugin.folderPathSetting.keyForAccurateDirectory = parseInt(value);
		await this.plugin.saveSettings();

		switch(value){
			case '0':
				this.deleteCustomDirectoryOption();
				this.plugin.checkForValidDesktopBeforeSaving();
				break;
			case '1':
				this.deleteCustomDirectoryOption();
				this.plugin.folderPathSetting.directoryPath = "";
				 //This directory path is set to "" by default when user clicks the option 'same place as original note'.
				 //Reason is because at the moment the program doesn't don't know which note it should be looking for.
				 //Therefore, the program will have to wait for the user to actually click on a note and press the ".md-to.rtf" button
				 //so it can find its directory.

				await this.plugin.saveSettings();
				break;
			case '2':
				this.plugin.folderPathSetting.directoryPath = "";
				this.createCustomDirectoryOption();
				break;
		}
		
			
	}

}
