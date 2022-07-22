import React, { FormEvent, useState } from 'react';
import { utils, read } from "xlsx";
import logo from './logo.svg';
import './App.css';
import { AsyncLocalStorage } from 'async_hooks';

type Word = {
    definitions: Array<string>;
    word: string;
    notes: string;
    imgUrl?: string;
}

type WordComponentProps = {
    word: Word;
}

function WordComponent({ word }: WordComponentProps) {
    const listDefinitions = word.definitions.map((definition, index) =>
        (<li key={index}>{definition}</li>)
    );

    return (
        <div>
            <p className="App-WordComponent-Word">
                {word.word}
            </p>
            <ul>
                {listDefinitions}
            </ul>
        </div>
    )
}

type SearchComponentProps = {
    onSearch: (search: string) => void;
    onPressWord: (word: Word) => void;
    words: Array<Word>;
}

function SearchComponent({ onSearch, words, onPressWord }: SearchComponentProps) {
    const [search, setSearch] = useState("")

    const componentWord = (word: Word) => {
        return (<div className="wordElement" key={word.word} onClick={() => {
            setSearch("");
            onPressWord(word);
        }}>{word.word}</div>)
    }

    const componentWords = () => {
        return words.map((word) => {
            return componentWord(word);
        })
    }

    return (
        <div>
            <label>Search: </label>
            <input type="text" value={search} onChange={(e) => {
                setSearch(e.target.value);
                onSearch(e.target.value)
            }} />
            { search != "" && (<div>{componentWords()}</div>)}
        </div>
    )
}

function App() {
    const cachedWords = JSON.parse(localStorage.getItem("words") || "[]");

    const [words, setWords] = useState<Array<Word>>(cachedWords);

    const [search, setSearch] = useState("");

    const [cursor, setCursor] = useState(0);

    const [iframeDict, setIframeDict] = useState(true);

    const nextCursor = (cursor: number): number => {
        if (cursor < 0) {
            return words.length - 1;
        } else if (words.length > cursor + 1) {
            return cursor + 1;
        }
        return 0;
    }

    const updateWordNotes = (notes: string) => {
        const cachedWords = JSON.parse(localStorage.getItem("words") || "[]");
        cachedWords[cursor] = {...cachedWords[cursor], notes: notes}
        localStorage.setItem("words", JSON.stringify(cachedWords));
    }

    const loadDocument = (event: any) => {
        const [file] = event.target.files;

        const reader = new FileReader();
        reader.onload = (e: any) => {
            const data = e.target.result;
            const vocabulary = read(data, { type: 'binary' });
            const newWords: any = [];

            vocabulary.SheetNames.forEach((sheetName) => {
                utils.sheet_to_json(vocabulary.Sheets[sheetName]).map((row) => {
                    const rowList = Object.values(row as object);
                    newWords.push({ word: rowList[0], definitions: rowList });
                });
            });

            localStorage.setItem("words", JSON.stringify(newWords));
            setWords(newWords);
            setCursor(newWords.length() - 1)
        };

        reader.onerror = (error: any) => {
            console.error(error);
        }

        reader.readAsBinaryString(file);
    }

    const onSearch = (search: string) => {
        setSearch(search);
    }

    const filteredWords = () => {
        return words.filter((word: Word) => {
            return search == "" || word.word.startsWith(search);
        });
    }

    const onPressWordSearcher = (word: Word) => {
        const index = words.findIndex((el) => el == word);
        setCursor(index);
    }

    const wordNotes = () => {
        if("notes" in words[cursor]) {
            return words[cursor]["notes"];
        }
        return "";
    }


    return (
        <div className="App" >
        <div>
        <input name="vocabulary" type="file" onChange={loadDocument} />
        </div>

        <div className="App-content">
        <div className="App-cursor">
        <div>total words: {words.length}</div>
        <div>press (d) to find in dictionary</div>
        <input
        type="number"
        value={cursor}
                        onChange={(e) => setCursor(nextCursor(+(e.target.value) - 1))}
                        onKeyUp={(e) => {
                            if (e.key === "d") {
                                setIframeDict(!iframeDict);
                            }
                        }
                        } /><button onClick={() => setCursor(nextCursor(cursor))}>Next</button>
                    <SearchComponent
                        words={filteredWords()}
                        onSearch={onSearch}
                        onPressWord={onPressWordSearcher} />
                </div>
                {cursor < words.length && cursor >= 0 && (
                    <>
                        <WordComponent word={words[cursor]} />
                        <iframe src={`https://dictionary.cambridge.org/dictionary/english/${words[cursor].word}`} height="300" width="300" hidden={iframeDict} />
                        <textarea name="notes" className="App-notes" onChange={e => updateWordNotes(e.target.value) } value={wordNotes()}></textarea>
                    </>
                )}
            </div>
        </div>
    );
}

export default App;
