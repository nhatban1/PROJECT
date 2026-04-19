declare module "*.css";

declare module "pdfmake/build/fonts/Roboto" {
	const fontContainer: {
		vfs: Record<string, string>;
		fonts: Record<string, { normal?: string; bold?: string; italics?: string; bolditalics?: string }>;
	};

	export default fontContainer;
}