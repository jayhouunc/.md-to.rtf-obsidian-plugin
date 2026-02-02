import {Notice} from 'obsidian';

export default class Notices{

    public static pluginName: string = "(.MD to.RTF Converter) ";

    public static newNotice(text: string): Notice{
		return new Notice(this.pluginName + " " + text);
	}

	public static newErrorNotice(text: string, errorText: any): Notice{
		//If there isn't an error to pass in, just set errorText argument to ""
		if(errorText == "")
			return new Notice(this.pluginName + "⚠️" + text);

		return new Notice(this.pluginName + "⚠️" + text + " (" + errorText.toString() + ")");
	}
}