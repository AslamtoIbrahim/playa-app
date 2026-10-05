import type { KeyboardEvent } from 'react';

/**
 * Navigation clavier entre les cellules d'un tableau de saisie.
 *
 * Les tableaux de saisie (répartition, vente, commission) partagent la même
 * grille : une cellule éditable contient un `input`, un `button` ou un
 * `role="combobox"` (les `SearchSelect`), tandis que les colonnes purement
 * visuelles (écart calculé) et les bandeaux de groupe n'exposent aucun élément
 * focusable.
 *
 * Les flèches du clavier déplacent donc le focus vers la prochaine cellule
 * *focusable* dans la direction demandée : une colonne d'affichage est ignorée
 * au lieu de bloquer la navigation, et les bandeaux de groupe sont traversés
 * pour relier deux blocs de lignes consécutifs.
 */

/** Sélecteur des éléments que l'on peut cibler au clavier dans une cellule. */
const FOCUSABLE_CELL_SELECTOR = 'input, button, [role="combobox"]';

const ARROW_KEYS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];

/** Sens de parcours parmi les lignes ou les colonnes d'une grille. */
type NavigationDirection = 'next' | 'previous';

function isArrowKey(key: string): boolean {
    return ARROW_KEYS.includes(key);
}

/**
 * Premier élément focusable d'une cellule, `null` lorsque la cellule est
 * purement informative (colonne d'écart, bandeau de groupe).
 */
function findFocusable(cell: Element | null | undefined): HTMLElement | null {
    const target = cell?.querySelector(FOCUSABLE_CELL_SELECTOR);

    if (target instanceof HTMLElement) {
        {
            return target;
        }
    }

    return null;
}

/**
 * Donne le focus à la cellule voisine et sélectionne son contenu, afin qu'une
 * frappe remplace la valeur proposée au lieu de s'y accoler.
 */
function focusCell(cell: Element | null | undefined): void {
    const target = findFocusable(cell);

    if (!target) {
        {
            return;
        }
    }

    target.focus();

    if (target instanceof HTMLInputElement) {
        {
            target.select();
        }
    }
}

/** Cellule focusable voisine sur la même ligne. */
function findHorizontalCell(
    cell: HTMLTableCellElement,
    direction: NavigationDirection,
): HTMLTableCellElement | null {
    let sibling =
        direction === 'next'
            ? cell.nextElementSibling
            : cell.previousElementSibling;

    while (sibling) {
        if (sibling instanceof HTMLTableCellElement && findFocusable(sibling)) {
            {
                return sibling;
            }
        }

        sibling =
            direction === 'next'
                ? sibling.nextElementSibling
                : sibling.previousElementSibling;
    }

    return null;
}

/**
 * Cellule focusable voisine sur la ligne du dessus ou du dessous, à la même
 * position de colonne. Le parcours reste cantonné au corps du tableau et
 * ignore les lignes sans champ éditable (bandeaux de groupe).
 */
function findVerticalCell(
    row: HTMLTableRowElement,
    cellIndex: number,
    direction: NavigationDirection,
): HTMLTableCellElement | null {
    const body = row.parentElement;

    let siblingRow =
        direction === 'next'
            ? row.nextElementSibling
            : row.previousElementSibling;

    while (siblingRow && siblingRow.parentElement === body) {
        if (siblingRow instanceof HTMLTableRowElement) {
            const cell = siblingRow.cells.item(cellIndex);

            if (cell && findFocusable(cell)) {
                {
                    return cell;
                }
            }
        }

        siblingRow =
            direction === 'next'
                ? siblingRow.nextElementSibling
                : siblingRow.previousElementSibling;
    }

    return null;
}

/**
 * Déplace le focus vers la cellule voisine à l'aide des flèches du clavier.
 *
 * Le déplacement part de la cellule qui contient l'élément ciblé : `←` et `→`
 * restent sur la ligne courante, `↑` et `↓` changent de ligne en conservant
 * l'index de colonne. Les cellules dépourvues de champ éditable sont
 * traversées au lieu d'arrêter la navigation.
 */
export function navigateToAdjacentCell(e: KeyboardEvent<HTMLElement>): void {
    if (!isArrowKey(e.key)) {
        {
            return;
        }
    }

    e.preventDefault();

    const cell = (e.target as HTMLElement | null)?.closest('td');

    if (!(cell instanceof HTMLTableCellElement)) {
        {
            return;
        }
    }

    const row = cell.parentElement;

    if (!(row instanceof HTMLTableRowElement)) {
        {
            return;
        }
    }

    let target: HTMLTableCellElement | null = null;

    if (e.key === 'ArrowRight') {
        {
            target = findHorizontalCell(cell, 'next');
        }
    }

    if (e.key === 'ArrowLeft') {
        {
            target = findHorizontalCell(cell, 'previous');
        }
    }

    if (e.key === 'ArrowDown') {
        {
            target = findVerticalCell(row, cell.cellIndex, 'next');
        }
    }

    if (e.key === 'ArrowUp') {
        {
            target = findVerticalCell(row, cell.cellIndex, 'previous');
        }
    }

    focusCell(target);
}
