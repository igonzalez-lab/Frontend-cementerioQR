import React, { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { SHOW_ERROR_MESSAGE, SHOW_SUCCESS_MESSAGE } from '../../slices/notificationSlice';
import { decryptMessage, encryptMessage } from '../../helpers/helpers';
import { useDispatch, useSelector } from 'react-redux';
import { jwtDecode } from 'jwt-decode';

import { Alert, Box, Button, CircularProgress, Collapse, IconButton, InputAdornment, Paper, TextField, Tooltip, Typography } from '@mui/material';
import { Close, Edit, Emergency } from '@mui/icons-material';

import ReactQuill from 'react-quill-new';
import 'quill/dist/quill.snow.css';

const modules = {
    toolbar: [
        [{ 'header': [1, 2, 3, false] }],  // Encabezados
        ['bold', 'italic', 'underline', 'strike'], // Negrita, cursiva, subrayado, tachado
        [{ 'list': 'ordered' }, { 'list': 'bullet' }], // Listas ordenadas y sin orden
        ['blockquote', 'code-block'], // Citas y bloques de código
        ['link', 'image', 'video'], // Enlaces, imágenes y vídeos
        [{ 'align': [] }], // Alineación
        [{ 'color': [] }, { 'background': [] }], // Colores de texto y fondo
        [{ 'font': [] }], // Tipos de letra
        [{ 'script': 'sub' }, { 'script': 'super' }], // Subíndice, superíndice
        [{ 'indent': '-1' }, { 'indent': '+1' }], // Indentación
        ['clean'] // Limpiar formato
    ],
};

const HistoriaFamiliar = ({ people, viewOnly }) => {
    const dispatch = useDispatch();
    const containerRef = useRef(null);
    const token = useSelector((state) => state.user_cementerio_qr.data);

    const [width, setWidth] = useState(0);
    const [loading, setLoading] = useState(false);
    const [openDanger, setOpenDanger] = useState(true);

    const [paisOrigen, setPaisOrigen] = useState('');
    const [ciudadOrigen, setCiudadOrigen] = useState('');
    const [fechaLlegada, setFechaLlegada] = useState('');
    const [barrioAsentamiento, setBarrioAsentamiento] = useState('');
    const [comunidadReligiosa, setComunidadReligiosa] = useState('');
    const [historiaMigratoria, setHistoriaMigratoria] = useState({});
    const [tradicionesFamiliares, setTradicionesFamiliares] = useState({});

    const handleGetData = useCallback(async () => {
        try {
            setLoading(true);

            const requestHeader = new Headers();
            requestHeader.append('Authorization', `Bearer ${decryptMessage(token)}`);
            requestHeader.append('Content-Type', 'application/json');

            const requestOptions = {
                method: 'GET',
                headers: requestHeader,
                redirect: 'follow'
            };

            const response = await fetch(`${import.meta.env.VITE_BACKEND_ADDRESS}/api-ajch/people/history/${people.id}`, requestOptions);
            const responseJson = await response.json();

            if (responseJson.error) {
                throw new Error(responseJson.message);
            }

            if (responseJson.message) {
                setPaisOrigen(decryptMessage(responseJson.message.pais_origen));
                setCiudadOrigen(decryptMessage(responseJson.message.ciudad_origen));
                setFechaLlegada(decryptMessage(responseJson.message.fecha_llegada));
                setBarrioAsentamiento(decryptMessage(responseJson.message.barrio_asentamiento));
                setComunidadReligiosa(decryptMessage(responseJson.message.comunidad_religiosa));
                setHistoriaMigratoria(JSON.parse(decryptMessage(responseJson.message.historia_migratoria)));
                setTradicionesFamiliares(JSON.parse(decryptMessage(responseJson.message.tradiciones_familiares)));
            }

            setLoading(false);
        }
        catch (error) {
            setLoading(false);
            dispatch(SHOW_ERROR_MESSAGE(error.message));
        }
    }, [token, people, setLoading, dispatch, decryptMessage, setPaisOrigen, setCiudadOrigen, setFechaLlegada, setBarrioAsentamiento, setComunidadReligiosa, setTradicionesFamiliares, setHistoriaMigratoria]);

    const handlePutData = useCallback(async () => {
        try {
            setLoading(true);

            if (paisOrigen === '') {
                throw new Error('Complete el País de Origen');
            }

            if (ciudadOrigen === '') {
                throw new Error('Complete la Ciudad de Origen');
            }

            if (ciudadOrigen === '') {
                throw new Error('Complete la Fecha de Llegada');
            }

            if (barrioAsentamiento === '') {
                throw new Error('Complete el Barrio de Asentamiento');
            }

            if (comunidadReligiosa === '') {
                throw new Error('Complete la Comunidad Religiosa');
            }

            if (historiaMigratoria !== undefined) {
                if (String(historiaMigratoria.ops[0].insert).trim() === '') {
                    throw new Error('Complete la Historia Migratoria');
                }
            }

            if (tradicionesFamiliares !== undefined) {
                if (String(tradicionesFamiliares.ops[0].insert).trim() === '') {
                    throw new Error('Complete la Tradición Familiar');
                }
            }

            const requestHeader = new Headers();
            requestHeader.append('Authorization', `Bearer ${decryptMessage(token)}`);
            requestHeader.append('Content-Type', 'application/json');

            const requestBody = JSON.stringify({
                'people_id': encryptMessage(String(people.id)),
                'origin_country': encryptMessage(paisOrigen.trim()),
                'origin_city': encryptMessage(ciudadOrigen.trim()),
                'arrive_date': encryptMessage(fechaLlegada.trim()),
                'settlement_neighborhood': encryptMessage(barrioAsentamiento.trim()),
                'religion_comunity': encryptMessage(comunidadReligiosa.trim()),
                'migratory_history': encryptMessage(JSON.stringify(historiaMigratoria)),
                'familiar_traditions': encryptMessage(JSON.stringify(tradicionesFamiliares)),
            });

            const requestOptions = {
                method: 'PUT',
                headers: requestHeader,
                body: requestBody,
                redirect: 'follow'
            };

            const response = await fetch(`${import.meta.env.VITE_BACKEND_ADDRESS}/api-ajch/people/history`, requestOptions);
            const responseJson = await response.json();

            if (responseJson.error) {
                throw new Error(responseJson.message);
            }

            setLoading(false);
            dispatch(SHOW_SUCCESS_MESSAGE(responseJson.message));
        }
        catch (error) {
            setLoading(false);
            dispatch(SHOW_ERROR_MESSAGE(error.message));
        }
    }, [token, people, paisOrigen, ciudadOrigen, fechaLlegada, barrioAsentamiento, comunidadReligiosa, historiaMigratoria, tradicionesFamiliares, dispatch, setLoading, decryptMessage, encryptMessage]);

    useEffect(() => {
        const updateWidth = () => {
            if (containerRef.current) {
                setWidth(containerRef.current.offsetWidth);
            }
        };

        updateWidth();

        const resizeObserver = new ResizeObserver(() => updateWidth());

        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }

        return () => resizeObserver.disconnect();
    }, [containerRef]);

    useEffect(() => {
        handleGetData();
    }, [handleGetData]);

    return (
        <Fragment>
            {loading ? (
                <Box component={Paper} elevation={0} variant='outlined' display={'flex'} alignItems={'center'} p={2}>
                    <CircularProgress />
                    <Typography ml={2}>Procesando, espere...</Typography>
                </Box>
            ) : (
                <Fragment>
                    {!viewOnly && (
                        String(decryptMessage(jwtDecode(decryptMessage(token)).role)) === '5' && (
                            <Box mb={2} position={'sticky'} top={130} zIndex={9} width={'fit-content'}>
                                <Button disableElevation variant='contained' color='primary' startIcon={<Edit />} onClick={handlePutData}>
                                    <Typography variant='button'>Actualizar datos</Typography>
                                </Button>
                            </Box>
                        )
                    )}

                    {!viewOnly && (
                        <Collapse in={openDanger}>
                            <Alert
                                action={
                                    <Tooltip title='Cerrar alerta'>
                                        <IconButton color='inherit' size='small' onClick={() => setOpenDanger(false)}>
                                            <Close fontSize='inherit' />
                                        </IconButton>
                                    </Tooltip>
                                }
                                severity='error'
                                sx={{ mb: 2 }}
                            >
                                <Box display={'flex'} alignItems={'center'}>
                                    <Emergency color='error' fontSize='small' sx={{ mr: 1 }} />
                                    Datos obligatorios
                                </Box>
                            </Alert>
                        </Collapse>
                    )}

                    <Box ref={containerRef} component={Paper} elevation={0} variant='outlined' display={'flex'} alignItems={'center'} flexDirection={'column'} p={2}>
                        <TextField fullWidth disabled={viewOnly} variant='outlined' label='País de Origen' value={paisOrigen} onChange={(e) => setPaisOrigen(e.target.value)} slotProps={{
                            input: {
                                startAdornment: (
                                    <InputAdornment position='start'>
                                        <Tooltip title={'Obligatorio'}>
                                            <Emergency color='error' fontSize='small' />
                                        </Tooltip>
                                    </InputAdornment>
                                ),
                            }
                        }} sx={{ mb: 2 }} />
                        <TextField fullWidth disabled={viewOnly} variant='outlined' label='Ciudad de Origen' value={ciudadOrigen} onChange={(e) => setCiudadOrigen(e.target.value)} slotProps={{
                            input: {
                                startAdornment: (
                                    <InputAdornment position='start'>
                                        <Tooltip title={'Obligatorio'}>
                                            <Emergency color='error' fontSize='small' />
                                        </Tooltip>
                                    </InputAdornment>
                                ),
                            }
                        }} sx={{ mb: 2 }} />
                        <TextField fullWidth disabled={viewOnly} variant='outlined' type='date' label='Fecha de llegada a Chile' value={fechaLlegada} onChange={(e) => setFechaLlegada(e.target.value)} sx={{ mb: 2 }} slotProps={{
                            input: {
                                startAdornment: (
                                    <InputAdornment position='start'>
                                        <Tooltip title={'Obligatorio'}>
                                            <Emergency color='error' fontSize='small' />
                                        </Tooltip>
                                    </InputAdornment>
                                ),
                            }
                        }} />
                        <TextField fullWidth disabled={viewOnly} variant='outlined' label='Barrio de Asentamiento inicial en Chile' value={barrioAsentamiento} onChange={(e) => setBarrioAsentamiento(e.target.value)} sx={{ mb: 2 }} slotProps={{
                            input: {
                                startAdornment: (
                                    <InputAdornment position='start'>
                                        <Tooltip title={'Obligatorio'}>
                                            <Emergency color='error' fontSize='small' />
                                        </Tooltip>
                                    </InputAdornment>
                                ),
                            }
                        }} />
                        <TextField fullWidth disabled={viewOnly} variant='outlined' label='Comunidad Religiosa de Pertenencia' value={comunidadReligiosa} onChange={(e) => setComunidadReligiosa(e.target.value)} sx={{ mb: 2 }} slotProps={{
                            input: {
                                startAdornment: (
                                    <InputAdornment position='start'>
                                        <Tooltip title={'Obligatorio'}>
                                            <Emergency color='error' fontSize='small' />
                                        </Tooltip>
                                    </InputAdornment>
                                ),
                            }
                        }} />

                        <Box component={Paper} elevation={0} mb={2}>
                            <Box display={'flex'} alignItems={'center'}>
                                <Tooltip title={'Obligatorio'}>
                                    <Emergency color='error' fontSize='small' />
                                </Tooltip>

                                <Typography color='textSecondary' variant='caption' ml={1}>Tradiciones Familiares Especiales</Typography>
                            </Box>

                            <ReactQuill
                                value={tradicionesFamiliares}
                                onChange={(content, delta, source, editor) => setTradicionesFamiliares(editor.getContents())}
                                modules={modules}
                                theme='snow'
                                placeholder='Escribe algo...'
                                style={{ width: width - 35, fontFamily: 'Roboto, sans-serif' }}
                                className='rounded'
                                readOnly={viewOnly}
                            />
                        </Box>

                        <Box component={Paper} elevation={0}>
                            <Box display={'flex'} alignItems={'center'}>
                                <Tooltip title={'Obligatorio'}>
                                    <Emergency color='error' fontSize='small' />
                                </Tooltip>

                                <Typography color='textSecondary' variant='caption' ml={1}>Historia Migratoria Detallada</Typography>
                            </Box>

                            <ReactQuill
                                value={historiaMigratoria}
                                onChange={(content, delta, source, editor) => setHistoriaMigratoria(editor.getContents())}
                                modules={modules}
                                theme='snow'
                                placeholder='Escribe algo...'
                                style={{ width: width - 35, fontFamily: 'Roboto, sans-serif' }}
                                className='rounded'
                                readOnly={viewOnly}
                            />
                        </Box>
                    </Box>
                </Fragment>
            )}
        </Fragment>
    )
};

export default HistoriaFamiliar;
