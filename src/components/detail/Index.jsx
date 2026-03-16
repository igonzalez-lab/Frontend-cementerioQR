import React, { useCallback, useEffect, useState, Fragment } from 'react';
import { useParams, Link as LinkRRD } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import { decryptMessage } from '../../helpers/helpers';
import { SHOW_ERROR_MESSAGE } from '../../slices/notificationSlice';

import { common } from '@mui/material/colors';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import { Person, Refresh, Warning } from '@mui/icons-material';
import { Box, Breadcrumbs, Button, Paper, Typography, useMediaQuery, useTheme, Link as LinkMUI, Tab, CircularProgress } from '@mui/material';

import IndexTimeline from '../timeline/Index';
import HistoriaFamiliar from './../people/HistoriaFamiliar';
import IndexArbolGenealogico from '../arbol_genealogico/Index';
import IndexLapidasCementerios from '../lapidas_cementerios/Index';
import DocumentacionHistorica from './../people/DocumentacionHistorica';
import IndexCicloDeVidaTradiciones from '../ciclo_de_vida_tradiciones/Index';
import IndexSobrevivientesHolocausto from '../sobrevivientes_holocausto/Index';
import IndexContribucionesComunitarias from '../contribuciones_comunitarias/Index';

const Index = () => {
    const theme = useTheme();
    const { id } = useParams();
    const dispatch = useDispatch();
    const token = useSelector((state) => state.user_cementerio_qr.data);
    const mobileScreen = useMediaQuery(theme.breakpoints.between('xs', 'sm'));

    const [tabPosition, setTabPosition] = useState('1');

    const [people, setPeople] = useState(null);
    const [peopleError, setPeopleError] = useState(false);
    const [peopleErrorMessage, setPeopleErrorMessage] = useState('');

    const handleGetData = useCallback(async (id) => {
        try {
            setPeople(null);

            const requestHeader = new Headers();
            requestHeader.append('Authorization', `Bearer ${decryptMessage(token)}`);
            requestHeader.append('Content-Type', 'application/json');

            const requestOptions = {
                method: 'GET',
                headers: requestHeader,
                redirect: 'follow'
            };

            const response = await fetch(`${import.meta.env.VITE_BACKEND_ADDRESS}/api-ajch/people/${id}`, requestOptions);
            const responseJson = await response.json();

            if (responseJson.error) {
                throw new Error(responseJson.message);
            }

            setPeople(responseJson.message[0]);
            setPeopleError(false);
            setPeopleErrorMessage('');
        }
        catch (error) {
            dispatch(SHOW_ERROR_MESSAGE(error.message));

            setPeople(null);
            setPeopleError(true);
            setPeopleErrorMessage(error.message);
        }
    }, [token, dispatch, setPeople, setPeopleError, setPeopleErrorMessage]);

    useEffect(() => {
        if (id) {
            handleGetData(id);
        }
    }, [id, handleGetData]);

    return (
        <Box maxWidth={mobileScreen ? '87vw' : '100%'}>
            {peopleError ? (
                <Box component={Paper} elevation={0} variant='outlined' display={'flex'} flexDirection={'column'} justifyContent={'center'} p={2}>
                    <Box display={'flex'} alignItems={'center'} mb={1}>
                        <Warning color='warning' fontSize='large' />
                        <Typography ml={1}>Error al obtener las persona: {peopleErrorMessage}</Typography>
                    </Box>
                    <Button disableElevation variant='contained' color='primary' startIcon={<Refresh />} sx={{ width: 'fit-content' }} onClick={() => handleGetData(id)}>
                        <Typography variant='button'>Consultar nuevamente</Typography>
                    </Button>
                </Box>
            ) : people === null ? (
                <Box component={Paper} elevation={0} variant='outlined' display={'flex'} alignItems={'center'} p={2}>
                    <CircularProgress />
                    <Typography ml={2}>Cargando persona</Typography>
                </Box>
            ) : (
                <Fragment>
                    <Box display={'flex'} alignItems={'center'}>
                        <Person fontSize='large' />
                        <Typography variant='h4' ml={1}>{decryptMessage(people.nombre_espanol)}</Typography>
                    </Box>

                    <Box role='presentation' onClick={(e) => e.preventDefault()} mb={2}>
                        <Breadcrumbs maxItems={5}>
                            <LinkMUI underline='hover' color='textPrimary' display={'flex'} alignItems={'center'} component={LinkRRD} to={`/personas/${people.id}`} state={{ people: people }}>
                                <Person sx={{ mr: 0.5 }} fontSize='inherit' />
                                <Typography>{decryptMessage(people.nombre_espanol)}</Typography>
                            </LinkMUI>
                        </Breadcrumbs>
                    </Box>

                    <Box component={Paper} elevation={0} variant='outlined' mt={2}>
                        <TabContext value={tabPosition}>
                            <Box borderBottom={0.1} borderColor={'divider'} position={'sticky'} top={64} bgcolor={common['white']} zIndex={10} sx={{ borderTopLeftRadius: 4, borderTopRightRadius: 4 }}>
                                <TabList onChange={(e, v) => setTabPosition(v)} variant='scrollable'>
                                    <Tab label='Historia Familiar' value='1' />
                                    <Tab label='Documentación Histórica' value='2' />
                                    <Tab label='Ciclo de Vida y Tradiciones' value='3' />
                                    <Tab label='Arbol Genealógico Familiar' value='4' />
                                    <Tab label='Sobrevivientes del holocausto' value='5' />
                                    <Tab label='Contribuciones comunitarias' value='6' />
                                    <Tab label='Lapida y cementerio' value='7' />
                                    <Tab label='Linea de Tiempo' value='8' />
                                </TabList>
                            </Box>
                            <TabPanel value='1'>
                                <HistoriaFamiliar people={people} viewOnly={true} />
                            </TabPanel>
                            <TabPanel value='2'>
                                <DocumentacionHistorica people={people} viewOnly={true} />
                            </TabPanel>
                            <TabPanel value='3' sx={{ p: 0 }}>
                                <IndexCicloDeVidaTradiciones people={people} viewOnly={true} />
                            </TabPanel>
                            <TabPanel value='4'>
                                <IndexArbolGenealogico people={people} viewOnly={true} />
                            </TabPanel>
                            <TabPanel value='5'>
                                <IndexSobrevivientesHolocausto people={people} viewOnly={true} />
                            </TabPanel>
                            <TabPanel value='6' sx={{ p: 0 }}>
                                <IndexContribucionesComunitarias people={people} viewOnly={true} />
                            </TabPanel>
                            <TabPanel value='7'>
                                <IndexLapidasCementerios people={people} viewOnly={true} />
                            </TabPanel>
                            <TabPanel value='8'>
                                <IndexTimeline people={people} viewOnly={true} personal={true} />
                            </TabPanel>
                        </TabContext>
                    </Box>
                </Fragment>
            )}
        </Box>
    )
};

export default Index;
