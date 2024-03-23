interface IndentConfig {
	tabSize: number;
	insertSpaces: boolean;
}

function indent(input: HTMLTextAreaElement, config: IndentConfig) {
	const { tabSize, insertSpaces } = config;

	const start = input.selectionStart;
	const end = input.selectionEnd;
	const value = input.value;
	const value_length = value.length;

	const line_start = getLineStart(value, start);
	const line_end = getLineEnd(value, end);

	const start_at_line_start = start === 0 || value[start - 1] === "\n";
	const end_at_line_end = end === value_length || value[end] === "\n" || value[end] === "\r";
	const select_both_ends = start !== end && start_at_line_start && end_at_line_end;

	if (select_both_ends || isMultiLine(value, start, end)) {
		const replacement = value.slice(line_start, line_end).replaceAll(/^[ \t]*/gm, (leading, offset, str) => {
			if (str[offset] === "\n" || str[offset] === "\r" || offset === line_end) return leading;

			const tab_count = 1 + ~~(countLeadingSpaces(leading, 0, tabSize) / tabSize);

			if (insertSpaces) {
				return " ".repeat(tab_count * tabSize);
			}
			return "\t".repeat(tab_count);
		});
		input.setRangeText(replacement, line_start, line_end);
		input.dispatchEvent(new Event("input"));
		return;
	}

	let replacement = "\t";
	if (insertSpaces) {
		const padding = tabSize - ((start - line_start) % tabSize);
		replacement = " ".repeat(padding);
	}

	input.setRangeText(replacement, start, end, "end");
	input.dispatchEvent(new Event("input"));
}

export function hookIndent(input: HTMLTextAreaElement, config: IndentConfig) {
	const onKeydown = (e: KeyboardEvent) => {
		if (e.key !== "Tab" || e.shiftKey) return;
		e.preventDefault();
		indent(e.target as HTMLTextAreaElement, config);
	};

	input.addEventListener("keydown", onKeydown);
	return () => {
		input.removeEventListener("keydown", onKeydown);
	};
}

function outdent(input: HTMLTextAreaElement, config: IndentConfig) {
	const { tabSize, insertSpaces } = config;

	const start = input.selectionStart;
	const end = input.selectionEnd;
	const value = input.value;

	const line_start = getLineStart(value, start);
	const line_end = getLineEnd(value, end);

	const value_slice = value.slice(line_start, line_end);

	const replacement = value_slice.replaceAll(/^[ \t]*/gm, (leading) => {
		const tab_count = ~~((countLeadingSpaces(leading, 0, tabSize) - tabSize) / tabSize);
		if (tab_count <= 0) return "";

		if (insertSpaces) {
			return " ".repeat(tab_count * tabSize);
		}
		return "\t".repeat(tab_count);
	});
	if (replacement === value_slice) return;
	input.setRangeText(replacement, line_start, line_end);
	input.dispatchEvent(new Event("input"));
}

export function hookOutdent(input: HTMLTextAreaElement, config: IndentConfig) {
	const onKeydown = (e: KeyboardEvent) => {
		if (e.key !== "Tab" || !e.shiftKey) return;
		e.preventDefault();
		outdent(e.target as HTMLTextAreaElement, config);
	};

	input.addEventListener("keydown", onKeydown);
	return () => {
		input.removeEventListener("keydown", onKeydown);
	};
}

function getLineStart(value: string, index: number) {
	while (index > 0 && value[index - 1] !== "\n") {
		index--;
	}
	return index;
}

function getLineEnd(value: string, index: number) {
	if (index > 0 && value[index - 1] === "\n") {
		return index - 1;
	}

	while (index < value.length && value[index] !== "\n" && value[index] !== "\r") {
		index++;
	}
	return index;
}

function isMultiLine(value: string, start: number, end: number) {
	for (let i = start; i < end; i++) {
		if (value[i] === "\n") {
			return true;
		}
	}
	return false;
}

function countLeadingSpaces(value: string, start: number, tabSize: number) {
	let count = 0;
	for (let i = start; i < value.length; i++) {
		if (value[i] === " ") {
			count++;
		} else if (value[i] === "\t") {
			count += tabSize;
		} else {
			break;
		}
	}

	return count;
}
