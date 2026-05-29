'use client'

import { useMemo } from 'react';
import CodeMirror, { EditorView } from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { cpp } from '@codemirror/lang-cpp';
import { java } from '@codemirror/lang-java';
import { useTheme } from "next-themes";
import { githubDark, githubLight } from '@uiw/codemirror-theme-github';

function extensionsFor(language: string) {
    switch (language) {
        case 'PYTHON':
            return [python()];
        case 'TYPESCRIPT':
            return [javascript({ typescript: true })];
        case 'JAVASCRIPT':
            return [javascript()];
        case 'JAVA':
            return [java()];
        case 'CPP':
        case 'C':
            return [cpp()];
        default:
            return [];
    }
}

interface CodeEditorProps {
    value: string
    onChange?: (value: string) => void
    language: string
    readOnly?: boolean
    minHeight?: string
}

export function CodeEditor({
    value,
    onChange,
    language,
    readOnly = false,
    minHeight = '420px',
}: CodeEditorProps) {
    const { resolvedTheme } = useTheme();

    const extensions = useMemo(
        () => [...extensionsFor(language), EditorView.lineWrapping],
        [language],
    );

    return (
        <CodeMirror
            value={value}
            onChange={onChange}
            readOnly={readOnly}
            theme={resolvedTheme === 'dark' ? githubDark : githubLight}
            extensions={extensions}
            basicSetup={{
                lineNumbers: true,
                highlightActiveLine: !readOnly,
                foldGutter: true,
                autocompletion: true,
            }}
            style={{
                fontSize: '13px',
                minHeight,
                fontFamily: 'var(--font-mono)',
            }}
        />
    );
}
