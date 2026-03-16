import React, { useCallback, useEffect, useMemo, useRef, useState, Fragment } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { Check, Clear, Close, CompareArrows, Emergency, MoveDown, MoveUp, PersonAdd } from '@mui/icons-material';
import { Alert, AlertTitle, Box, Button, Divider, IconButton, Paper, TextField, Tooltip, Typography } from '@mui/material';

import { decryptMessage, encryptMessage } from '../../helpers/helpers';
import { SHOW_ERROR_MESSAGE, SHOW_SUCCESS_MESSAGE } from '../../slices/notificationSlice';

const uid = () => {
    return 'p_' + Math.random().toString(16).slice(2) + Date.now().toString(16);
}

const buildMaps = (personas) => {
    const byId = new Map(personas.map((p) => [p.id, p]));
    const childrenOf = new Map();

    for (const p of personas) {
        for (const parentId of p.parentIds || []) {
            if (!childrenOf.has(parentId)) {
                childrenOf.set(parentId, []);
            }

            childrenOf.get(parentId).push(p.id);
        }
    }
    return { byId, childrenOf };
}

const computeLevels = (personas) => {
    const { byId } = buildMaps(personas);
    const roots = personas.filter((p) => !p.parentIds || p.parentIds.length === 0).map((p) => p.id);

    const level = new Map();
    for (const r of roots) level.set(r, 0);

    let changed = true;
    let guard = 0;

    while (changed && guard < 5000) {
        guard++;
        changed = false;

        for (const p of personas) {
            const parents = p.parentIds || [];

            if (parents.length === 0) {
                if (!level.has(p.id)) {
                    level.set(p.id, 0);
                    changed = true;
                }

                continue;
            }

            let maxParent = -Infinity;
            let ok = true;

            for (const pid of parents) {
                if (!byId.has(pid)) {
                    continue;
                }

                if (!level.has(pid)) {
                    ok = false;
                    break;
                }

                maxParent = Math.max(maxParent, level.get(pid));
            }

            if (!ok) {
                continue;
            }

            const candidate = maxParent + 1;

            if (!level.has(p.id) || level.get(p.id) !== candidate) {
                level.set(p.id, candidate);
                changed = true;
            }
        }
    }

    for (const p of personas) if (!level.has(p.id)) level.set(p.id, 0);

    return level;
}

const computeLayout = (personas, nodeW = 220, nodeH = 78, gapX = 40, gapY = 120) => {
    const level = computeLevels(personas);
    const groups = new Map();

    for (const p of personas) {
        const lv = level.get(p.id) ?? 0;

        if (!groups.has(lv)) {
            groups.set(lv, []);
        }

        groups.get(lv).push(p);
    }

    const levels = Array.from(groups.keys()).sort((a, b) => a - b);
    const pos = new Map();
    let maxX = 0;

    for (const lv of levels) {
        const row = groups
            .get(lv)
            .slice()
            .sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));

        for (let i = 0; i < row.length; i++) {
            const x = i * (nodeW + gapX);
            const y = lv * gapY;
            pos.set(row[i].id, { x, y });
            maxX = Math.max(maxX, x);
        }
    }

    const width = maxX + nodeW + 80;
    const height = (levels.at(-1) ?? 0) * gapY + nodeH + 120;

    return { pos, width, height, nodeW, nodeH };
}

export default function Index({ people, viewOnly }) {
    const dispatch = useDispatch();
    const token = useSelector((state) => state.user_cementerio_qr.data);

    const [personas, setPersonas] = useState([]);
    const [selectedId, setSelectedId] = useState('');

    const [scale, setScale] = useState(1);
    const [offset, setOffset] = useState({ x: 40, y: 40 });
    const dragging = useRef(false);
    const dragStart = useRef({ x: 0, y: 0 });
    const offsetStart = useRef({ x: 0, y: 0 });

    const { pos, width, height, nodeW, nodeH } = useMemo(
        () => computeLayout(personas),
        [personas]
    );

    const { byId, childrenOf } = useMemo(() => buildMaps(personas), [personas]);
    const selected = byId.get(selectedId);

    const addRootMe = () => {
        const meId = uid();

        setPersonas([{ id: meId, nombre: 'Tú', parentIds: [], notas: '' }]);
        setSelectedId(meId);
        setOffset({ x: 40, y: 40 });
        setScale(1);
    };

    const addParent = (childId) => {
        if (!childId) {
            return;
        }

        const parentId = uid();

        setPersonas((prev) => {
            const next = prev.map((p) => {
                if (p.id !== childId) return p;
                const parents = Array.isArray(p.parentIds) ? p.parentIds.slice() : [];
                if (parents.length >= 2) return p;
                parents.push(parentId);
                return { ...p, parentIds: parents };
            });

            next.push({ id: parentId, nombre: 'Nuevo Padre/Madre', parentIds: [], notas: '' });
            return next;
        });

        setSelectedId(parentId);
    };

    const addChild = (parentId) => {
        if (!parentId) return;
        const childId = uid();
        setPersonas((prev) => [
            ...prev,
            { id: childId, nombre: 'Nuevo Hijo', parentIds: [parentId], notas: '' },
        ]);
        setSelectedId(childId);
    };

    const addSibling = (personId) => {
        if (!personId) return;
        const p = byId.get(personId);
        const sibId = uid();

        setPersonas((prev) => [
            ...prev,
            {
                id: sibId,
                nombre: 'Nuevo Hermano/a',
                parentIds: (p?.parentIds || []).slice(),
                notas: '',
            },
        ]);

        setSelectedId(sibId);
    };

    const updateSelectedName = (nombre) => {
        setPersonas((prev) => prev.map((p) => (p.id === selectedId ? { ...p, nombre } : p)));
    };

    const updateSelectedNotes = (notas) => {
        setPersonas((prev) => prev.map((p) => (p.id === selectedId ? { ...p, notas } : p)));
    };

    const deletePerson = (idToDelete) => {
        if (!idToDelete) return;

        const p = byId.get(idToDelete);
        const label = p?.nombre ? `'${p.nombre}'` : idToDelete;

        const ok = window.confirm(
            `¿Eliminar ${label}? Esto quitará sus vínculos como padre/madre en los hijos.`
        );
        if (!ok) return;

        setPersonas((prev) => {
            const remaining = prev.filter((x) => x.id !== idToDelete);
            const cleaned = remaining.map((x) => ({
                ...x,
                parentIds: (x.parentIds || []).filter((pid) => pid !== idToDelete),
            }));
            return cleaned;
        });

        setSelectedId((prevSel) => {
            if (prevSel !== idToDelete) return prevSel;
            const other = personas.find((x) => x.id !== idToDelete);
            return other?.id || '';
        });
    };


    const onWheel = (e) => {
        e.preventDefault();
        const delta = -e.deltaY;
        const factor = delta > 0 ? 1.08 : 0.92;
        setScale((s) => Math.min(2.2, Math.max(0.35, s * factor)));
    };

    const onMouseDown = (e) => {
        if (e.button !== 0) return;
        dragging.current = true;
        dragStart.current = { x: e.clientX, y: e.clientY };
        offsetStart.current = { ...offset };
    };

    const onMouseMove = (e) => {
        if (!dragging.current) return;
        const dx = e.clientX - dragStart.current.x;
        const dy = e.clientY - dragStart.current.y;
        setOffset({ x: offsetStart.current.x + dx, y: offsetStart.current.y + dy });
    };

    const onMouseUp = () => {
        dragging.current = false;
    };

    const handleGetData = useCallback(async (id) => {
        try {
            setPersonas([]);

            const requestHeader = new Headers();
            requestHeader.append('Authorization', `Bearer ${decryptMessage(token)}`);
            requestHeader.append('Content-Type', 'application/json');

            const requestOptions = {
                method: 'GET',
                headers: requestHeader,
                redirect: 'follow'
            };

            const response = await fetch(`${import.meta.env.VITE_BACKEND_ADDRESS}/api-ajch/tree/${id}`, requestOptions);
            const responseJson = await response.json();

            if (responseJson.error) {
                throw new Error(responseJson.message);
            }

            if (responseJson.message.length > 0) {
                setPersonas(JSON.parse(decryptMessage(responseJson.message[0].contenido)));
            }
        }
        catch (error) {
            dispatch(SHOW_ERROR_MESSAGE(error.message));
        }
    }, [token, dispatch, setPersonas]);

    const handlePutData = useCallback(async () => {
        try {
            const requestHeader = new Headers();
            requestHeader.append('Authorization', `Bearer ${decryptMessage(token)}`);
            requestHeader.append('Content-Type', 'application/json');

            const requestBody = JSON.stringify({
                'people_id': encryptMessage(String(people.id)),
                'content': encryptMessage(JSON.stringify(personas)),
            });

            const requestOptions = {
                method: 'PUT',
                headers: requestHeader,
                body: requestBody,
                redirect: 'follow'
            };

            const response = await fetch(`${import.meta.env.VITE_BACKEND_ADDRESS}/api-ajch/tree/`, requestOptions);
            const responseJson = await response.json();

            if (responseJson.error) {
                throw new Error(responseJson.message);
            }

            dispatch(SHOW_SUCCESS_MESSAGE(responseJson.message));
        }
        catch (error) {
            dispatch(SHOW_ERROR_MESSAGE(error.message));
        }
    }, [people, token, personas, dispatch, decryptMessage, encryptMessage]);


    const links = [];

    for (const p of personas) {
        const childPos = pos.get(p.id);

        if (!childPos) continue;

        for (const parentId of p.parentIds || []) {
            const parPos = pos.get(parentId);
            if (!parPos) continue;

            links.push({
                from: { x: parPos.x + nodeW / 2, y: parPos.y + nodeH },
                to: { x: childPos.x + nodeW / 2, y: childPos.y },
                key: `${parentId}->${p.id}`,
            });
        }
    }

    useEffect(() => {
        if (people) {
            handleGetData(String(people.id));
        }
    }, [people, handleGetData]);

    return (
        <Box sx={{ display: 'grid', gridTemplateColumns: '380px 1fr', height: 'fit-content' }}>
            <Box component={Paper} elevation={0} variant='outlined' p={2} overflow={'auto'}>
                <Typography variant='h6' mb={1}>Árbol Genealógico</Typography>

                <Divider sx={{ mx: -2, mb: 2 }} />

                {!viewOnly && (
                    <Fragment>
                        {selectedId && (
                            <Alert severity='info'>
                                <AlertTitle>ID Seleccionado</AlertTitle>
                                {selectedId}
                            </Alert>
                        )}

                        <Alert severity='error' sx={{ my: 2 }}>
                            <Box display={'flex'} alignItems={'center'}>
                                <Emergency color='error' fontSize='small' sx={{ mr: 1 }} />
                                Datos obligatorios
                            </Box>
                        </Alert>
                    </Fragment>
                )}

                <TextField fullWidth variant='outlined' label={<Box display={'flex'} alignItems={'center'}>
                    <Emergency color='error' fontSize='small' sx={{ mr: 0.5 }} />
                    Nombre
                </Box>} disabled={!selectedId || viewOnly} value={selected?.nombre || ''} onChange={(e) => updateSelectedName(e.target.value)} sx={{ mb: 2 }} />

                <TextField fullWidth multiline rows={5} variant='outlined' label={<Box display={'flex'} alignItems={'center'}>
                    <Emergency color='error' fontSize='small' sx={{ mr: 0.5 }} />
                    Notas genealógicas
                </Box>} disabled={!selectedId || viewOnly} value={selected?.notas || ''} onChange={(e) => updateSelectedNotes(e.target.value)} sx={{ mb: 2 }} />

                <Box style={{ display: 'grid', gap: 8 }}>
                    {!viewOnly && (
                        <Fragment>
                            <Button disableElevation disabled={!selectedId} variant='contained' color='primary' startIcon={<MoveUp />} onClick={() => addParent(selectedId)} sx={{ mb: 1 }}>
                                <Typography variant='button'>Agregar Padre/Madre (arriba)</Typography>
                            </Button>

                            <Button disableElevation disabled={!selectedId} variant='contained' color='primary' startIcon={<MoveDown />} onClick={() => addChild(selectedId)} sx={{ mb: 1 }}>
                                <Typography variant='button'>Agregar Hijo (abajo)</Typography>
                            </Button>

                            <Button disableElevation disabled={!selectedId} variant='contained' color='primary' startIcon={<CompareArrows />} onClick={() => addSibling(selectedId)} sx={{ mb: 1 }}>
                                <Typography variant='button'>Agregar Hermano/a (al lado)</Typography>
                            </Button>

                            <Button disableElevation disabled={!selectedId} variant='contained' color='error' startIcon={<Clear />} onClick={() => deletePerson(selectedId)} sx={{ mb: 1 }}>
                                <Typography variant='button'>Eliminar seleccionado</Typography>
                            </Button>

                            {personas.length === 0 && (
                                <Button disableElevation variant='contained' color='info' startIcon={<PersonAdd />} onClick={addRootMe} sx={{ mb: 1 }}>
                                    <Typography variant='button'>Agregar “Tú”</Typography>
                                </Button>
                            )}

                            <Divider sx={{ mx: -2, mb: 1 }} />

                            <Button disableElevation disabled={personas.length === 0} variant='contained' color='primary' startIcon={<Check />} onClick={handlePutData} sx={{ mb: 1 }}>
                                <Typography variant='button'>Guardar Arbol Genealógico</Typography>
                            </Button>
                        </Fragment>
                    )}

                    <Alert severity='info'>
                        <Box><b>Personas totales:</b> {personas.length}</Box>
                        <Box><b>Hijos del seleccionado:</b> {(childrenOf.get(selectedId) || []).length}</Box>
                        <Box><b>Padres del seleccionado:</b> {(selected?.parentIds || []).length}</Box>
                    </Alert>
                </Box>
            </Box>

            <Box onWheel={onWheel} onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp} style={{ position: 'relative', overflow: 'hidden', background: '#fafafa', cursor: dragging.current ? 'grabbing' : 'grab' }}>
                {personas.length === 0 ? (
                    <Box style={{ height: '100%', display: 'grid', placeItems: 'center', padding: 24 }}>
                        <Box component={Paper} elevation={0} variant='outlined' p={2}>
                            <Typography variant='h6'>No hay personas en el árbol</Typography>

                            {!viewOnly && (
                                <Fragment>
                                    <Typography mb={2}>Haz clic en el botón para crear el primer nodo y comenzar.</Typography>

                                    <Button disableElevation variant='contained' color='primary' startIcon={<PersonAdd />} onClick={addRootMe}>
                                        <Typography variant='button'>Agregar “Tú”</Typography>
                                    </Button>
                                </Fragment>
                            )}
                        </Box>
                    </Box>
                ) : (
                    <Box style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`, transformOrigin: '0 0', width, height, position: 'relative' }}>
                        <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }}>
                            {links.map((l) => (
                                <path
                                    key={l.key}
                                    d={`M ${l.from.x} ${l.from.y} C ${l.from.x} ${l.from.y + 40}, ${l.to.x} ${l.to.y - 40}, ${l.to.x} ${l.to.y}`}
                                    fill='none'
                                    stroke='#999'
                                    strokeWidth='2'
                                />
                            ))}
                        </svg>

                        {personas.map((p) => {
                            const ppos = pos.get(p.id) || { x: 0, y: 0 };
                            const isSel = p.id === selectedId;

                            return (
                                <Box key={p.id} component={Paper} elevation={0} onClick={() => setSelectedId(p.id)} style={{
                                    position: 'absolute', left: ppos.x, top: ppos.y, width: nodeW, height: nodeH,
                                    border: isSel ? '2px solid #2b6cff' : '1px solid #ddd',
                                    boxShadow: isSel
                                        ? '0 10px 24px rgba(43,108,255,0.18)'
                                        : '0 6px 16px rgba(0,0,0,0.06)',
                                    background: 'white',
                                    padding: 12,
                                    display: 'grid',
                                    gap: 6,
                                    userSelect: 'none',
                                }}
                                >
                                    {!viewOnly && (
                                        <Tooltip title='Eliminar nodo'>
                                            <IconButton size='small' onClick={(e) => {
                                                e.stopPropagation();
                                                deletePerson(p.id);
                                            }} sx={{ position: 'absolute', right: 8, top: 8 }}>
                                                <Close />
                                            </IconButton>
                                        </Tooltip>
                                    )}

                                    <Box fontWeight={900} lineHeight={1.15} overflow={'hidden'} textOverflow={'ellipsis'} whiteSpace={'nowrap'} pr={34}>{p.nombre}</Box>

                                    <Box style={{ fontSize: 12, opacity: 0.7, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {p.notas ? p.notas : '—'}
                                    </Box>
                                </Box>
                            );
                        })}
                    </Box>
                )}
            </Box>
        </Box>
    )
};
