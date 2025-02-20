import * as expect from 'expect';
import * as paredit from '../../../cursor-doc/paredit';
import * as mock from '../common/mock';
import { docFromTextNotation, textAndSelection } from '../common/text-notation';
import { ModelEditSelection } from '../../../cursor-doc/model';

/**
 * TODO: Use text-notation for these tests
 */

describe('paredit', () => {
    const docText = '(def foo [:foo :bar :baz])';
    let doc: mock.MockDocument,
        startSelection = new ModelEditSelection(0, 0);

    beforeEach(() => {
        doc = new mock.MockDocument();
        doc.insertString(docText);
        doc.selection = startSelection.clone();
    });

    describe('movement', () => {
        describe('rangeToSexprForward', () => {
            it('Finds the list in front', () => {
                const a = docFromTextNotation('|(def foo [vec])');
                const b = docFromTextNotation('|(def foo [vec])|');
                expect(paredit.forwardSexpRange(a)).toEqual(textAndSelection(b)[1]);
            });
            it('Finds the symbol in front', () => {
                const a = docFromTextNotation('(|def foo [vec])');
                const b = docFromTextNotation('(|def| foo [vec])');
                expect(paredit.forwardSexpRange(a)).toEqual(textAndSelection(b)[1]);
            });
            it('Finds the rest of the symbol', () => {
                const a = docFromTextNotation('(d|ef foo [vec])');
                const b = docFromTextNotation('(d|ef| foo [vec])');
                expect(paredit.forwardSexpRange(a)).toEqual(textAndSelection(b)[1]);
            });
            it('Finds the rest of the keyword', () => {
                const a = docFromTextNotation('(def foo [:foo :bar :ba|z])');
                const b = docFromTextNotation('(def foo [:foo :bar :ba|z|])');
                expect(paredit.forwardSexpRange(a)).toEqual(textAndSelection(b)[1]);
            });
            it('Includes space between the cursor and the symbol', () => {
                const a = docFromTextNotation('(def| foo [vec])');
                const b = docFromTextNotation('(def| foo| [vec])');
                expect(paredit.forwardSexpRange(a)).toEqual(textAndSelection(b)[1]);
            });
            it('Finds the vector in front', () => {
                const a = docFromTextNotation('(def foo |[vec])');
                const b = docFromTextNotation('(def foo |[vec]|)');
                expect(paredit.forwardSexpRange(a)).toEqual(textAndSelection(b)[1]);
            });
            it('Finds the keyword in front', () => {
                const a = docFromTextNotation('(def foo [:foo :bar |:baz])');
                const b = docFromTextNotation('(def foo [:foo :bar |:baz|])');
                expect(paredit.forwardSexpRange(a)).toEqual(textAndSelection(b)[1]);
            });
            it('Returns empty range when no forward sexp', () => {
                const a = docFromTextNotation('(def foo [:foo :bar :baz|])');
                const b = docFromTextNotation('(def foo [:foo :bar :baz|])');
                expect(paredit.forwardSexpRange(a)).toEqual(textAndSelection(b)[1]);
            });
            it('Finds next symbol, including leading space', () => {
                const a = docFromTextNotation('(|>|def|>| foo [vec])');
                const b = docFromTextNotation('(def|>| foo|>| [vec])');
                expect(paredit.forwardSexpRange(a)).toEqual(textAndSelection(b)[1]);
            });
            it('Finds following vector including leading space', () => {
                const a = docFromTextNotation('(|>|def foo|>| [vec])');
                const b = docFromTextNotation('(def foo|>| [vec]|>|)');
                expect(paredit.forwardSexpRange(a)).toEqual(textAndSelection(b)[1]);
            });
            it('Reverses direction of selection and finds next sexp', () => {
                const a = docFromTextNotation('(|<|def foo|<| [vec])');
                const b = docFromTextNotation('(def foo|>| [vec]|>|)');
                expect(paredit.forwardSexpRange(a)).toEqual(textAndSelection(b)[1]);
            });
        });

        describe('rangeToSexprBackward', () => {
            it('Finds previous form, including space, and reverses direction', () => {
                // TODO: Should we really be reversing the direction here?
                const a = docFromTextNotation('(def |<|foo [vec]|<|)');
                const b = docFromTextNotation('(|>|def |>|foo [vec])');
                expect(paredit.backwardSexpRange(a)).toEqual(textAndSelection(b)[1]);
            });
        })

        describe('moveToRangeRight', () => {
            it('Places cursor at the right end of the selection', () => {
                const a = docFromTextNotation('(def |>|foo|>| [vec])');
                const b = docFromTextNotation('(def foo| [vec])');
                paredit.moveToRangeRight(a, textAndSelection(a)[1]);
                expect(textAndSelection(a)).toEqual(textAndSelection(b));
            });
            it('Places cursor at the right end of the selection 2', () => {
                const a = docFromTextNotation('(|>|def foo|>| [vec])');
                const b = docFromTextNotation('(def foo| [vec])');
                paredit.moveToRangeRight(a, textAndSelection(a)[1]);
                expect(textAndSelection(a)).toEqual(textAndSelection(b));
            });
            it('Move to right of given range, regardless of previous selection', () => {
                const a = docFromTextNotation('(|<|def|<| foo [vec])');
                const b = docFromTextNotation('(def foo |>|[vec]|>|)');
                const c = docFromTextNotation('(def foo [vec]|)');
                paredit.moveToRangeRight(a, textAndSelection(b)[1]);
                expect(textAndSelection(a)).toEqual(textAndSelection(c));
            });
        })

        describe('moveToRangeLeft', () => {
            it('Places cursor at the left end of the selection', () => {
                const a = docFromTextNotation('(def |>|foo|>| [vec])');
                const b = docFromTextNotation('(def |foo [vec])');
                paredit.moveToRangeLeft(a, textAndSelection(a)[1]);
                expect(textAndSelection(a)).toEqual(textAndSelection(b));
            });
            it('Places cursor at the left end of the selection 2', () => {
                const a = docFromTextNotation('(|>|def foo|>| [vec])');
                const b = docFromTextNotation('(|def foo [vec])');
                paredit.moveToRangeLeft(a, textAndSelection(a)[1]);
                expect(textAndSelection(a)).toEqual(textAndSelection(b));
            });
            it('Move to left of given range, regardless of previous selection', () => {
                const a = docFromTextNotation('(|<|def|<| foo [vec])');
                const b = docFromTextNotation('(def foo |>|[vec]|>|)');
                const c = docFromTextNotation('(def foo |[vec])');
                paredit.moveToRangeLeft(a, textAndSelection(b)[1]);
                expect(textAndSelection(a)).toEqual(textAndSelection(c));
            });
        });
    });

    describe('Reader tags', () => {
        it('rangeToForwardDownList', () => {
            const a = docFromTextNotation('(a(b(|c•#f•(#b •[:f :b :z])•#z•1)))');
            const b = docFromTextNotation('(a(b(|c•#f•(|#b •[:f :b :z])•#z•1)))');
            expect(paredit.rangeToForwardDownList(a)).toEqual(textAndSelection(b)[1]);
        });
        it('rangeToBackwardUpList', () => {
            const a = docFromTextNotation('(a(b(c•#f•(|#b •[:f :b :z])•#z•1)))');
            const b = docFromTextNotation('(a(b(c•|#f•(|#b •[:f :b :z])•#z•1)))');
            expect(paredit.rangeToBackwardUpList(a)).toEqual(textAndSelection(b)[1]);
        });
        it('rangeToBackwardUpList 2', () => {
            // TODO: This is wrong! But real Paredit behaves as it should...
            const a = docFromTextNotation('(a(b(c•#f•(#b •|[:f :b :z])•#z•1)))');
            const b = docFromTextNotation('(a(b|(c•#f•(#b •|[:f :b :z])•#z•1)))');
            expect(paredit.rangeToBackwardUpList(a)).toEqual(textAndSelection(b)[1]);
        });
        it('dragSexprBackward', () => {
            const a = docFromTextNotation('(a(b(c•#f•|(#b •[:f :b :z])•#z•1)))');
            const b = docFromTextNotation('(a(b(#f•|(#b •[:f :b :z])•c•#z•1)))');
            paredit.dragSexprBackward(a)
            expect(textAndSelection(a)).toEqual(textAndSelection(b));
        });
        it('dragSexprForward', () => {
            const a = docFromTextNotation('(a(b(c•#f•|(#b •[:f :b :z])•#z•1)))');
            const b = docFromTextNotation('(a(b(c•#z•1•#f•|(#b •[:f :b :z]))))');
            paredit.dragSexprForward(a)
            expect(textAndSelection(a)).toEqual(textAndSelection(b));
        });
        describe('Stacked readers', () => {
            const docText = '(c\n#f\n(#b \n[:f :b :z])\n#x\n#y\n1)';
            let doc: mock.MockDocument;

            beforeEach(() => {
                doc = new mock.MockDocument();
                doc.insertString(docText);
            });
            it('dragSexprBackward', () => {
                const a = docFromTextNotation('(c•#f•(#b •[:f :b :z])•#x•#y•|1)');
                const b = docFromTextNotation('(c•#x•#y•|1•#f•(#b •[:f :b :z]))');
                paredit.dragSexprBackward(a)
                expect(textAndSelection(a)).toEqual(textAndSelection(b));
            });
            it('dragSexprForward', () => {
                const a = docFromTextNotation('(c•#f•|(#b •[:f :b :z])•#x•#y•1)');
                const b = docFromTextNotation('(c•#x•#y•1•#f•|(#b •[:f :b :z]))');
                paredit.dragSexprForward(a)
                expect(textAndSelection(a)).toEqual(textAndSelection(b));
            });
        })
        describe('Top Level Readers', () => {
            const docText = '#f\n(#b \n[:f :b :z])\n#x\n#y\n1\n#å#ä#ö';
            let doc: mock.MockDocument;

            beforeEach(() => {
                doc = new mock.MockDocument();
                doc.insertString(docText);
            });
            it('dragSexprBackward: #f•(#b •[:f :b :z])•#x•#y•|1•#å#ä#ö => #x•#y•1•#f•(#b •[:f :b :z])•#å#ä#ö', () => {
                doc.selection = new ModelEditSelection(26, 26);
                paredit.dragSexprBackward(doc);
                expect(doc.model.getText(0, Infinity)).toBe('#x\n#y\n1\n#f\n(#b \n[:f :b :z])\n#å#ä#ö');
            });
            it('dragSexprForward: #f•|(#b •[:f :b :z])•#x•#y•1#å#ä#ö => #x•#y•1•#f•|(#b •[:f :b :z])•#å#ä#ö', () => {
                doc.selection = new ModelEditSelection(3, 3);
                paredit.dragSexprForward(doc);
                expect(doc.model.getText(0, Infinity)).toBe('#x\n#y\n1\n#f\n(#b \n[:f :b :z])\n#å#ä#ö');
                expect(doc.selection).toEqual(new ModelEditSelection(11));
            });
            it('dragSexprForward: #f•(#b •[:f :b :z])•#x•#y•|1•#å#ä#ö => #f•(#b •[:f :b :z])•#x•#y•|1•#å#ä#ö', () => {
                doc.selection = new ModelEditSelection(26, 26);
                paredit.dragSexprForward(doc);
                expect(doc.model.getText(0, Infinity)).toBe('#f\n(#b \n[:f :b :z])\n#x\n#y\n1\n#å#ä#ö');
                expect(doc.selection).toEqual(new ModelEditSelection(26));
            });
        })
    });

    describe('selection', () => {
        describe('selectRangeBackward', () => {
            // TODO: Fix #498
            it('Extends backward selections backwards', () => {
                const a = docFromTextNotation('(def foo [:foo :bar |<|:baz|<|])');
                const selDoc = docFromTextNotation('(def foo [:foo |:bar| :baz])');
                const b = docFromTextNotation('(def foo [:foo |<|:bar :baz|<|])');
                paredit.selectRangeBackward(a, [selDoc.selection.anchor, selDoc.selection.active]);
                expect(textAndSelection(a)).toEqual(textAndSelection(b));
            });
            it('Contracts forward selection and extends backwards', () => {
                const a = docFromTextNotation('(def foo [:foo :bar |>|:baz|>|])');
                const selDoc = docFromTextNotation('(def foo [:foo |:bar| :baz])');
                const b = docFromTextNotation('(def foo [:foo |<|:bar |<|:baz])');
                paredit.selectRangeBackward(a, [selDoc.selection.anchor, selDoc.selection.active]);
                expect(textAndSelection(a)).toEqual(textAndSelection(b));
            });

        });

        describe('selectRangeForward', () => {
            it('(def foo [:foo >:bar> >|:baz>|]) => (def foo [:foo >:bar :baz>])', () => {
                const barSelection = new ModelEditSelection(15, 19),
                    bazRange = [20, 24] as [number, number],
                    barBazSelection = new ModelEditSelection(15, 24);
                doc.selection = barSelection;
                paredit.selectRangeForward(doc, bazRange);
                expect(doc.selection).toEqual(barBazSelection);
            });
            it('(def foo [<:foo :bar< >|:baz>|]) => (def foo [>:foo :bar :baz>])', () => {
                const [fooLeft, barRight] = [10, 19],
                    barFooSelection = new ModelEditSelection(barRight, fooLeft),
                    bazRange = [20, 24] as [number, number],
                    fooBazSelection = new ModelEditSelection(19, 24);
                doc.selection = barFooSelection;
                paredit.selectRangeForward(doc, bazRange);
                expect(doc.selection).toEqual(fooBazSelection);
            });
            it('(def foo [<:foo :bar< <|:baz<|]) => (def foo [>:foo :bar :baz>])', () => {
                const [fooLeft, barRight] = [10, 19],
                    barFooSelection = new ModelEditSelection(barRight, fooLeft),
                    bazRange = [24, 20] as [number, number],
                    fooBazSelection = new ModelEditSelection(19, 24);
                doc.selection = barFooSelection;
                paredit.selectRangeForward(doc, bazRange);
                expect(doc.selection).toEqual(fooBazSelection);
            });
        });
    });

    describe('selection stack', () => {
        const range = [15, 20] as [number, number];
        it('should make grow selection the topmost element on the stack', () => {
            paredit.growSelectionStack(doc, range);
            expect(doc.selectionStack[doc.selectionStack.length - 1]).toEqual(new ModelEditSelection(range[0], range[1]));
        });
        it('get us back to where we started if we just grow, then shrink', () => {
            const selectionBefore = startSelection.clone();
            paredit.growSelectionStack(doc, range);
            paredit.shrinkSelection(doc);
            expect(doc.selectionStack[doc.selectionStack.length - 1]).toEqual(selectionBefore);
        });
        it('should not add selections identical to the topmost', () => {
            const selectionBefore = doc.selection.clone();
            paredit.growSelectionStack(doc, range);
            paredit.growSelectionStack(doc, range);
            paredit.shrinkSelection(doc);
            expect(doc.selectionStack[doc.selectionStack.length - 1]).toEqual(selectionBefore);
        });
        it('should have A topmost after adding A, then B, then shrinking', () => {
            const a = range,
                b: [number, number] = [10, 24];
            paredit.growSelectionStack(doc, a);
            paredit.growSelectionStack(doc, b);
            paredit.shrinkSelection(doc);
            expect(doc.selectionStack[doc.selectionStack.length - 1]).toEqual(new ModelEditSelection(a[0], a[1]));
        });
    });

    describe('dragSexpr', () => {
        describe('forwardAndBackwardSexpr', () => {
            // (comment\n  ['(0 1 2 "t" "f")•   "b"•             {:s "h"}•             :f]•  [:f '(0 "t") "b" :s]•  [:f 0•   "b" :s•   4 :b]•  {:e '(e o ea)•   3 {:w? 'w}•   :t '(t i o im)•   :b 'b})
            let doc: mock.MockDocument;

            beforeEach(() => {
                doc = new mock.MockDocument();
                doc.insertString(docText);
            });

            it('drags forward in regular lists', () => {
                const a = docFromTextNotation(`(c• [:|f '(0 "t")•   "b" :s]•)`);
                const b = docFromTextNotation(`(c• ['(0 "t") :|f•   "b" :s]•)`);
                paredit.dragSexprForward(a);
                expect(textAndSelection(a)).toEqual(textAndSelection(b));
            });

            it('drags backward in regular lists', () => {
                const a = docFromTextNotation(`(c• [:f '(0 "t")•   "b"| :s]•)`);
                const b = docFromTextNotation(`(c• [:f "b"|•   '(0 "t") :s]•)`);
                paredit.dragSexprBackward(a);
                expect(textAndSelection(a)).toEqual(textAndSelection(b));
            });

            it('does not drag forward when sexpr is last in regular lists', () => {
                const dotText = `(c• [:f '(0 "t")•   "b" |:s ]•)`;
                const a = docFromTextNotation(dotText);
                const b = docFromTextNotation(dotText);
                paredit.dragSexprForward(a);
                expect(textAndSelection(a)).toEqual(textAndSelection(b));
            });

            it('does not drag backward when sexpr is last in regular lists', () => {
                const dotText = `(c• [ :|f '(0 "t")•   "b" :s ]•)`;
                const a = docFromTextNotation(dotText);
                const b = docFromTextNotation(dotText);
                paredit.dragSexprBackward(a);
                expect(textAndSelection(a)).toEqual(textAndSelection(b));
            });

            it('drags pair forward in maps', () => {
                const a = docFromTextNotation(`(c• {:|e '(e o ea)•   3 {:w? 'w}•   :t '(t i o im)•   :b 'b}•)`);
                const b = docFromTextNotation(`(c• {3 {:w? 'w}•   :|e '(e o ea)•   :t '(t i o im)•   :b 'b}•)`);
                paredit.dragSexprForward(a);
                expect(textAndSelection(a)).toEqual(textAndSelection(b));
            });

            it('drags pair backwards in maps', () => {
                const a = docFromTextNotation(`(c• {:e '(e o ea)•   3 {:w? 'w}•   :t '(t i o im)|•   :b 'b}•)`);
                const b = docFromTextNotation(`(c• {:e '(e o ea)•   :t '(t i o im)|•   3 {:w? 'w}•   :b 'b}•)`);
                paredit.dragSexprBackward(a);
                expect(textAndSelection(a)).toEqual(textAndSelection(b));
            });

            it('drags pair backwards in meta-data maps', () => {
                const a = docFromTextNotation(`(c• ^{:e '(e o ea)•   3 {:w? 'w}•   :t '(t i o im)|•   :b 'b}•)`);
                const b = docFromTextNotation(`(c• ^{:e '(e o ea)•   :t '(t i o im)|•   3 {:w? 'w}•   :b 'b}•)`);
                paredit.dragSexprBackward(a);
                expect(textAndSelection(a)).toEqual(textAndSelection(b));
            });

            it('drags single sexpr forward in sets', () => {
                const a = docFromTextNotation(`(c• #{:|e '(e o ea)•   3 {:w? 'w}•   :t '(t i o im)•   :b 'b}•)`);
                const b = docFromTextNotation(`(c• #{'(e o ea) :|e•   3 {:w? 'w}•   :t '(t i o im)•   :b 'b}•)`);
                paredit.dragSexprForward(a);
                expect(textAndSelection(a)).toEqual(textAndSelection(b));
            });

            it('drags pair in binding box', () => {
                const b = docFromTextNotation(`(c• [:e '(e o ea)•   3 {:w? 'w}•   :t |'(t i o im)•   :b 'b]•)`);
                const a = docFromTextNotation(`(c• [:e '(e o ea)•   3 {:w? 'w}•   :b 'b•   :t |'(t i o im)]•)`);
                paredit.dragSexprForward(b, ['c']);
                expect(textAndSelection(b)).toStrictEqual(textAndSelection(a));
            });
        });

        describe('backwardUp - one line', () => {
            it('(def foo [:><foo :bar :baz]) => (def foo :><foo [:bar :baz])', () => {
                const inKwFoo = 11;
                doc.selection = new ModelEditSelection(inKwFoo);
                paredit.dragSexprBackwardUp(doc);
                expect(doc.model.getText(0, Infinity)).toBe('(def foo :foo [:bar :baz])');
                expect(doc.selection).toEqual(new ModelEditSelection(10));
            });
            it('(def foo [:foo ><:bar :baz]) => (def foo ><:bar [:foo :baz])', () => {
                const kwBarLeft = 15;
                doc.selection = new ModelEditSelection(kwBarLeft);
                paredit.dragSexprBackwardUp(doc);
                expect(doc.model.getText(0, Infinity)).toBe('(def foo :bar [:foo :baz])');
                expect(doc.selection).toEqual(new ModelEditSelection(9));
            });
            it('(def foo [:foo :bar :baz><]) => (def foo :baz>< [:foo :bar])', () => {
                const kwBazRight = 24;
                doc.selection = new ModelEditSelection(kwBazRight);
                paredit.dragSexprBackwardUp(doc);
                expect(doc.model.getText(0, Infinity)).toBe('(def foo :baz [:foo :bar])');
                expect(doc.selection).toEqual(new ModelEditSelection(13));
            });
            it('(d>|e>|f foo [:foo :bar :baz]) => de><f (foo [:foo :bar :baz])', () => {
                const eSel = [2, 3];
                doc.selection = new ModelEditSelection(eSel[0], eSel[1]);
                paredit.dragSexprBackwardUp(doc);
                expect(doc.model.getText(0, Infinity)).toBe('def (foo [:foo :bar :baz])');
                expect(doc.selection).toEqual(new ModelEditSelection(2));
            });
        });
        describe('backwardUp - multi-line', () => {
            const docText = '((fn foo\n  [x]\n  [:foo\n   :bar\n   :baz])\n 1)';
            let doc: mock.MockDocument,
                startSelection = new ModelEditSelection(0, 0);

            beforeEach(() => {
                doc = new mock.MockDocument();
                doc.insertString(docText);
                doc.selection = startSelection.clone();
            });

            it('((fn foo\n  [x]\n  [><:foo\n   :bar\n   :baz])\n 1) => (fn foo\n  [x]\n  ><:foo\n  [:bar\n   :baz])\n(1)', () => {
                const kwFoo = 18;
                doc.selection = new ModelEditSelection(kwFoo);
                paredit.dragSexprBackwardUp(doc);
                expect(doc.model.getText(0, Infinity)).toBe('((fn foo\n  [x]\n  :foo\n  [:bar\n   :baz])\n 1)');
                expect(doc.selection).toEqual(new ModelEditSelection(17));
            });
            it('(><(fn foo\n  [x]\n  [:foo\n   :bar\n   :baz])\n 1) => ><(fn foo\n  [x]\n  [:foo\n   :bar\n   :baz])\n(1)', () => {
                const fnList = 1;
                doc.selection = new ModelEditSelection(fnList);
                paredit.dragSexprBackwardUp(doc);
                expect(doc.model.getText(0, Infinity)).toBe('(fn foo\n  [x]\n  [:foo\n   :bar\n   :baz])\n(1)');
                expect(doc.selection).toEqual(new ModelEditSelection(0));
            });
            it('((fn foo\n  [x]\n  [:foo\n   :bar\n   :baz])\n ><1) => ><1\n((fn foo\n  [x]\n  [:foo\n   :bar\n   :baz]))', () => {
                const one = 42;
                doc.selection = new ModelEditSelection(one);
                paredit.dragSexprBackwardUp(doc);
                expect(doc.model.getText(0, Infinity)).toBe('1\n((fn foo\n  [x]\n  [:foo\n   :bar\n   :baz]))');
                expect(doc.selection).toEqual(new ModelEditSelection(0));
            });
        });
        describe('forwardDown - one line', () => {
            it('(def f><oo [:foo :bar :baz]) => (def [f><oo :foo :bar :baz])', () => {
                const inFoo = 6;
                doc.selection = new ModelEditSelection(inFoo);
                paredit.dragSexprForwardDown(doc);
                expect(doc.model.getText(0, Infinity)).toBe('(def [foo :foo :bar :baz])');
                expect(doc.selection).toEqual(new ModelEditSelection(7));
            });
            it('(d>|ef>| foo [:foo :bar :baz]) => (foo [def>< :foo :bar :baz])', () => {
                const eSel = [2, 4];
                doc.selection = new ModelEditSelection(eSel[0], eSel[1]);
                paredit.dragSexprForwardDown(doc);
                expect(doc.model.getText(0, Infinity)).toBe('(foo [def :foo :bar :baz])');
                expect(doc.selection).toEqual(new ModelEditSelection(9));
            });
        });
        describe('forwardUp', () => {
            const docText = '((fn foo [x] [:foo :bar])) :baz';
            let doc: mock.MockDocument,
                startSelection = new ModelEditSelection(0, 0);

            beforeEach(() => {
                doc = new mock.MockDocument();
                doc.insertString(docText);
                doc.selection = startSelection.clone();
            });

            it('((fn foo [x] [:foo :b><ar])) :baz => ((fn foo [x] [:foo] :b><ar)) :baz', () => {
                const inBazKw = 21;
                doc.selection = new ModelEditSelection(inBazKw);
                paredit.dragSexprForwardUp(doc);
                expect(doc.model.getText(0, Infinity)).toBe('((fn foo [x] [:foo] :bar)) :baz');
                expect(doc.selection).toEqual(new ModelEditSelection(22));
            });
        });
        describe('backwardDown', () => {
            const docText = '((fn foo [x] [:foo :bar])) :baz';
            let doc: mock.MockDocument,
                startSelection = new ModelEditSelection(0, 0);

            beforeEach(() => {
                doc = new mock.MockDocument();
                doc.insertString(docText);
                doc.selection = startSelection.clone();
            });

            it('((fn foo [x] [:foo :b><ar])) :baz => ((fn foo [x] [:foo :b><ar])) :baz', () => {
                const inBazKw = 21;
                doc.selection = new ModelEditSelection(inBazKw);
                paredit.dragSexprBackwardDown(doc);
                expect(doc.model.getText(0, Infinity)).toBe(docText);
                expect(doc.selection).toEqual(new ModelEditSelection(21));
            });
            it('((fn foo [x] [:foo :bar])) :b><az => ((fn foo [x] [:foo :bar]) :b><az)', () => {
                const inBazKw = 29;
                doc.selection = new ModelEditSelection(inBazKw);
                paredit.dragSexprBackwardDown(doc);
                expect(doc.model.getText(0, Infinity)).toBe('((fn foo [x] [:foo :bar]) :baz)');
                expect(doc.selection).toEqual(new ModelEditSelection(28));
            });
        });
    });
    describe('edits', () => {
        describe('Close lists', () => {
            it('Advances cursor if at end of list of the same type', () => {
                const a = docFromTextNotation('(str "foo"|)');
                const b = docFromTextNotation('(str "foo")|');
                paredit.close(a, ')');
                expect(textAndSelection(a)).toEqual(textAndSelection(b));
            });
            it('Does not enter new closing parens in balanced doc', () => {
                const a = docFromTextNotation('(str |"foo")');
                const b = docFromTextNotation('(str |"foo")');
                paredit.close(a, ')');
                expect(textAndSelection(a)).toEqual(textAndSelection(b));
            });
            xit('Enter new closing parens in unbalanced doc', () => {
                // TODO: Reinstall this test once the corresponding cursor test works
                //       (The extension actually behaves correctly.)
                const a = docFromTextNotation('(str |"foo"');
                const b = docFromTextNotation('(str )|"foo"');
                paredit.close(a, ')');
                expect(textAndSelection(a)).toEqual(textAndSelection(b));
            });
            it('Enter new closing parens in string', () => {
                const a = docFromTextNotation('(str "|foo"');
                const b = docFromTextNotation('(str ")|foo"');
                paredit.close(a, ')');
                expect(textAndSelection(a)).toEqual(textAndSelection(b));
            });
        });
        describe('String quoting', () => {
            it('Closes quote at end of string', () => {
                const a = docFromTextNotation('(str "foo|")');
                const b = docFromTextNotation('(str "foo"|)');
                paredit.stringQuote(a);
                expect(textAndSelection(a)).toEqual(textAndSelection(b));
            });
        });
        describe('Slurping', () => {
            it('slurps form after list', () => {
                const a = docFromTextNotation('(str|) "foo"');
                const b = docFromTextNotation('(str| "foo")');
                paredit.forwardSlurpSexp(a);
                expect(textAndSelection(a)).toEqual(textAndSelection(b));
            });
            it('slurps, in multiline document', () => {
                const a = docFromTextNotation('(foo• (str| ) "foo")');
                const b = docFromTextNotation('(foo• (str| "foo"))');
                paredit.forwardSlurpSexp(a);
                expect(textAndSelection(a)).toEqual(textAndSelection(b));
            });
            it('slurps and adds leading space', () => {
                const a = docFromTextNotation('(s|tr)#(foo)');
                const b = docFromTextNotation('(s|tr #(foo))');
                paredit.forwardSlurpSexp(a);
                expect(textAndSelection(a)).toEqual(textAndSelection(b));
            });
            it('slurps without adding a space', () => {
                const a = docFromTextNotation('(s|tr )#(foo)');
                const b = docFromTextNotation('(s|tr #(foo))');
                paredit.forwardSlurpSexp(a);
                expect(textAndSelection(a)).toEqual(textAndSelection(b));
            });
            it('slurps, trimming inside whitespace', () => {
                const a = docFromTextNotation('(str|   )"foo"');
                const b = docFromTextNotation('(str| "foo")');
                paredit.forwardSlurpSexp(a);
                expect(textAndSelection(a)).toEqual(textAndSelection(b));
            });
            it('slurps, trimming outside whitespace', () => {
                const a = docFromTextNotation('(str|)   "foo"');
                const b = docFromTextNotation('(str| "foo")');
                paredit.forwardSlurpSexp(a);
                expect(textAndSelection(a)).toEqual(textAndSelection(b));
            });
            it('slurps, trimming inside and outside whitespace', () => {
                const a = docFromTextNotation('(str|   )   "foo"');
                const b = docFromTextNotation('(str| "foo")');
                paredit.forwardSlurpSexp(a);
                expect(textAndSelection(a)).toEqual(textAndSelection(b));
            });
            it('slurps form after empty list', () => {
                const a = docFromTextNotation('(|) "foo"');
                const b = docFromTextNotation('(| "foo")');
                paredit.forwardSlurpSexp(a);
                expect(textAndSelection(a)).toEqual(textAndSelection(b));
            });

            it('raises the current form when cursor is preceeding', () => {
                const a = docFromTextNotation('(comment•  (str |#(foo)))');
                const b = docFromTextNotation('(comment•  |#(foo))');
                paredit.raiseSexp(a);
                expect(textAndSelection(a)).toEqual(textAndSelection(b));
            });
            it('raises the current form when cursor is trailing', () => {
                const a = docFromTextNotation('(comment•  (str #(foo)|))');
                const b = docFromTextNotation('(comment•  #(foo)|)');
                paredit.raiseSexp(a);
                expect(textAndSelection(a)).toEqual(textAndSelection(b));
            });
        });
        describe('Kill character backwards (backspace)', () => {
            it('Leaves closing paren of empty list alone', () => {
                const a = docFromTextNotation('{::foo ()|• ::bar :foo}');
                const b = docFromTextNotation('{::foo (|)• ::bar :foo}');
                paredit.backspace(a);
                expect(textAndSelection(a)).toEqual(textAndSelection(b));
            });
            it('Deletes closing paren if unbalance', () => {
                const a = docFromTextNotation('{::foo )|• ::bar :foo}');
                const b = docFromTextNotation('{::foo |• ::bar :foo}');
                paredit.backspace(a);
                expect(textAndSelection(a)).toEqual(textAndSelection(b));
            });
            it('Leaves opening paren of non-empty list alone', () => {
                const a = docFromTextNotation('{::foo (|a)• ::bar :foo}');
                const b = docFromTextNotation('{::foo |(a)• ::bar :foo}');
                paredit.backspace(a);
                expect(textAndSelection(a)).toEqual(textAndSelection(b));
            });
            it('Leaves opening quote of non-empty string alone', () => {
                const a = docFromTextNotation('{::foo "|a"• ::bar :foo}');
                const b = docFromTextNotation('{::foo |"a"• ::bar :foo}');
                paredit.backspace(a);
                expect(textAndSelection(a)).toEqual(textAndSelection(b));
            });
            it('Leaves closing quote of non-empty string alone', () => {
                const a = docFromTextNotation('{::foo "a"|• ::bar :foo}');
                const b = docFromTextNotation('{::foo "a|"• ::bar :foo}');
                paredit.backspace(a);
                expect(textAndSelection(a)).toEqual(textAndSelection(b));
            });
            it('Deletes contents in strings', () => {
                const a = docFromTextNotation('{::foo "a|"• ::bar :foo}');
                const b = docFromTextNotation('{::foo "|"• ::bar :foo}');
                paredit.backspace(a);
                expect(textAndSelection(a)).toEqual(textAndSelection(b));
            });
            it('Deletes contents in strings 2', () => {
                const a = docFromTextNotation('{::foo "a|a"• ::bar :foo}');
                const b = docFromTextNotation('{::foo "|a"• ::bar :foo}');
                paredit.backspace(a);
                expect(textAndSelection(a)).toEqual(textAndSelection(b));
            });
            it('Deletes quoted quote', () => {
                const a = docFromTextNotation('{::foo \\"|• ::bar :foo}');
                const b = docFromTextNotation('{::foo |• ::bar :foo}');
                paredit.backspace(a);
                expect(textAndSelection(a)).toEqual(textAndSelection(b));
            });
            it('Deletes quoted quote in string', () => {
                const a = docFromTextNotation('{::foo "\\"|"• ::bar :foo}');
                const b = docFromTextNotation('{::foo "|"• ::bar :foo}');
                paredit.backspace(a);
                expect(textAndSelection(a)).toEqual(textAndSelection(b));
            });
            it('Deletes contents in list', () => {
                const a = docFromTextNotation('{::foo (a|)• ::bar :foo}');
                const b = docFromTextNotation('{::foo (|)• ::bar :foo}');
                paredit.backspace(a);
                expect(textAndSelection(a)).toEqual(textAndSelection(b));
            });
            it('Deletes empty list function', () => {
                const a = docFromTextNotation('{::foo (|)• ::bar :foo}');
                const b = docFromTextNotation('{::foo |• ::bar :foo}');
                paredit.backspace(a);
                expect(textAndSelection(a)).toEqual(textAndSelection(b));
            });
            it('Deletes empty set', () => {
                const a = docFromTextNotation('#{|}');
                const b = docFromTextNotation('|');
                paredit.backspace(a);
                expect(textAndSelection(a)).toEqual(textAndSelection(b));
            });
            it('Deletes empty literal function with trailing newline', () => {
                // https://github.com/BetterThanTomorrow/calva/issues/1079
                const a = docFromTextNotation('{::foo #(|)• ::bar :foo}');
                const b = docFromTextNotation('{::foo |• ::bar :foo}');
                paredit.backspace(a);
                expect(textAndSelection(a)).toEqual(textAndSelection(b));
            });
        });

        describe('Kill character forwards (delete)', () => {
            it('Leaves closing paren of empty list alone', () => {
                const a = docFromTextNotation('{::foo |()• ::bar :foo}');
                const b = docFromTextNotation('{::foo (|)• ::bar :foo}');
                paredit.deleteForward(a);
                expect(textAndSelection(a)).toEqual(textAndSelection(b));
            });
            it('Deletes closing paren if unbalance', () => {
                const a = docFromTextNotation('{::foo |)• ::bar :foo}');
                const b = docFromTextNotation('{::foo |• ::bar :foo}');
                paredit.deleteForward(a);
                expect(textAndSelection(a)).toEqual(textAndSelection(b));
            });
            it('Leaves opening paren of non-empty list alone', () => {
                const a = docFromTextNotation('{::foo |(a)• ::bar :foo}');
                const b = docFromTextNotation('{::foo (|a)• ::bar :foo}');
                paredit.deleteForward(a);
                expect(textAndSelection(a)).toEqual(textAndSelection(b));
            });
            it('Leaves opening quote of non-empty string alone', () => {
                const a = docFromTextNotation('{::foo |"a"• ::bar :foo}');
                const b = docFromTextNotation('{::foo "|a"• ::bar :foo}');
                paredit.deleteForward(a);
                expect(textAndSelection(a)).toEqual(textAndSelection(b));
            });
            it('Leaves closing quote of non-empty string alone', () => {
                const a = docFromTextNotation('{::foo "a|"• ::bar :foo}');
                const b = docFromTextNotation('{::foo "a"|• ::bar :foo}');
                paredit.deleteForward(a);
                expect(textAndSelection(a)).toEqual(textAndSelection(b));
            });
            it('Deletes contents in strings', () => {
                const a = docFromTextNotation('{::foo "|a"• ::bar :foo}');
                const b = docFromTextNotation('{::foo "|"• ::bar :foo}');
                paredit.deleteForward(a);
                expect(textAndSelection(a)).toEqual(textAndSelection(b));
            });
            it('Deletes contents in strings 2', () => {
                const a = docFromTextNotation('{::foo "|aa"• ::bar :foo}');
                const b = docFromTextNotation('{::foo "|a"• ::bar :foo}');
                paredit.deleteForward(a);
                expect(textAndSelection(a)).toEqual(textAndSelection(b));
            });
            it('Deletes quoted quote', () => {
                const a = docFromTextNotation('{::foo |\\"• ::bar :foo}');
                const b = docFromTextNotation('{::foo |• ::bar :foo}');
                paredit.deleteForward(a);
                expect(textAndSelection(a)).toEqual(textAndSelection(b));
            });
            it('Deletes quoted quote in string', () => {
                const a = docFromTextNotation('{::foo "|\\""• ::bar :foo}');
                const b = docFromTextNotation('{::foo "|"• ::bar :foo}');
                paredit.deleteForward(a);
                expect(textAndSelection(a)).toEqual(textAndSelection(b));
            });
            it('Deletes contents in list', () => {
                const a = docFromTextNotation('{::foo (|a)• ::bar :foo}');
                const b = docFromTextNotation('{::foo (|)• ::bar :foo}');
                paredit.deleteForward(a);
                expect(textAndSelection(a)).toEqual(textAndSelection(b));
            });
            it('Deletes empty list function', () => {
                const a = docFromTextNotation('{::foo (|)• ::bar :foo}');
                const b = docFromTextNotation('{::foo |• ::bar :foo}');
                paredit.deleteForward(a);
                expect(textAndSelection(a)).toEqual(textAndSelection(b));
            });
            it('Deletes empty set', () => {
                const a = docFromTextNotation('#{|}');
                const b = docFromTextNotation('|');
                paredit.deleteForward(a);
                expect(textAndSelection(a)).toEqual(textAndSelection(b));
            });
            it('Deletes empty literal function with trailing newline', () => {
                // https://github.com/BetterThanTomorrow/calva/issues/1079
                const a = docFromTextNotation('{::foo #(|)• ::bar :foo}');
                const b = docFromTextNotation('{::foo |• ::bar :foo}');
                paredit.deleteForward(a);
                expect(textAndSelection(a)).toEqual(textAndSelection(b));
            });
        });
    });
});




