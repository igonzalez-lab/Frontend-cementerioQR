import React, { Fragment, useState } from 'react';
import { useLocation, useNavigate, Link as LinkRRD } from 'react-router-dom';

import { common } from '@mui/material/colors';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import { ArrowBack, Home, People, Person, Warning } from '@mui/icons-material';
import { Box, Breadcrumbs, Button, Paper, Typography, useMediaQuery, useTheme, Link as LinkMUI, Tab } from '@mui/material';

import { decryptMessage } from '../../helpers/helpers';

import QrPagina from './QrPagina';
import IndexTimeline from '../timeline/Index';
import HistoriaFamiliar from './HistoriaFamiliar';
import DocumentacionHistorica from './DocumentacionHistorica';
import IndexArbolGenealogico from '../arbol_genealogico/Index';
import IndexLapidasCementerios from '../lapidas_cementerios/Index';
import IndexCicloDeVidaTradiciones from '../ciclo_de_vida_tradiciones/Index';
import IndexSobrevivientesHolocausto from '../sobrevivientes_holocausto/Index';
import IndexContribucionesComunitarias from '../contribuciones_comunitarias/Index';

const Detail = () => {
    const location = useLocation();
    const { people } = location.state || {};

    const theme = useTheme();
    const navigate = useNavigate();
    const mobileScreen = useMediaQuery(theme.breakpoints.between('xs', 'sm'));

    const [tabPosition, setTabPosition] = useState('1');

    return (
        <Box maxWidth={mobileScreen ? '87vw' : '100%'}>
            {people ? (
                <Fragment>
                    <Box display={'flex'} alignItems={'center'}>
                        <Person fontSize='large' />
                        <Typography variant='h4' ml={1}>{decryptMessage(people.nombre_espanol)}</Typography>
                    </Box>

                    <Box role='presentation' onClick={(e) => e.preventDefault()} mb={2}>
                        <Breadcrumbs maxItems={5}>
                            <LinkMUI underline='hover' color='textSecondary' display={'flex'} alignItems={'center'} component={LinkRRD} to={'/'}>
                                <Home sx={{ mr: 0.5 }} fontSize='inherit' />
                                <Typography>Menú Principal</Typography>
                            </LinkMUI>
                            <LinkMUI underline='hover' color='textSecondary' display={'flex'} alignItems={'center'} component={LinkRRD} to={'/personas'}>
                                <People sx={{ mr: 0.5 }} fontSize='inherit' />
                                <Typography>Personas</Typography>
                            </LinkMUI>
                            <LinkMUI underline='hover' color='textPrimary' display={'flex'} alignItems={'center'} component={LinkRRD} to={'/personas/detalle'} state={{ people: people }}>
                                <Person sx={{ mr: 0.5 }} fontSize='inherit' />
                                <Typography>{decryptMessage(people.nombre_espanol)}</Typography>
                            </LinkMUI>
                        </Breadcrumbs>
                    </Box>

                    <Button disableElevation variant='contained' color='info' startIcon={<ArrowBack />} component={LinkRRD} to={'/personas'}>
                        <Typography variant='button'>Volver a Personas</Typography>
                    </Button>

                    <Box component={Paper} elevation={0} variant='outlined' mt={2}>
                        <TabContext value={tabPosition}>
                            <Box borderBottom={0.1} borderColor={'divider'} position={'sticky'} top={64} bgcolor={common['white']} zIndex={10} sx={{ borderTopLeftRadius: 4, borderTopRightRadius: 4 }}>
                                <TabList onChange={(e, v) => setTabPosition(v)} variant='scrollable'>
                                    <Tab label='Código QR y Página' value='1' />
                                    <Tab label='Historia Familiar' value='2' />
                                    <Tab label='Documentación Histórica' value='3' />
                                    <Tab label='Ciclo de Vida y Tradiciones' value='4' />
                                    <Tab label='Arbol Genealógico Familiar' value='5' />
                                    <Tab label='Sobrevivientes del holocausto' value='6' />
                                    <Tab label='Contribuciones comunitarias' value='7' />
                                    <Tab label='Lapida y cementerio' value='8' />
                                    <Tab label='Linea de Tiempo' value='9' />
                                </TabList>
                            </Box>
                            <TabPanel value='1'>
                                <QrPagina people={people} />
                            </TabPanel>
                            <TabPanel value='2'>
                                <HistoriaFamiliar people={people} viewOnly={false} />
                            </TabPanel>
                            <TabPanel value='3'>
                                <DocumentacionHistorica people={people} viewOnly={false} />
                            </TabPanel>
                            <TabPanel value='4' sx={{ p: 0 }}>
                                <IndexCicloDeVidaTradiciones people={people} viewOnly={false} />
                            </TabPanel>
                            <TabPanel value='5'>
                                <IndexArbolGenealogico people={people} viewOnly={false} />
                            </TabPanel>
                            <TabPanel value='6'>
                                <IndexSobrevivientesHolocausto people={people} viewOnly={false} />
                            </TabPanel>
                            <TabPanel value='7' sx={{ p: 0 }}>
                                <IndexContribucionesComunitarias people={people} viewOnly={false} />
                            </TabPanel>
                            <TabPanel value='8'>
                                <IndexLapidasCementerios people={people} viewOnly={false} />
                            </TabPanel>
                            <TabPanel value='9'>
                                <IndexTimeline people={people} viewOnly={false} personal={true} />
                            </TabPanel>
                        </TabContext>
                    </Box>
                </Fragment>
            ) : (
                <Box component={Paper} elevation={0} variant='outlined' p={2} display={'flex'} flexDirection={'column'}>
                    <Box display={'flex'} alignItems={'center'} mb={2}>
                        <Warning fontSize='large' color='warning' />
                        <Typography ml={2}>Proporcione una persona válida para continuar</Typography>
                    </Box>

                    <Button disableElevation variant='contained' color='primary' startIcon={<ArrowBack />} sx={{ width: 'fit-content' }} onClick={() => navigate('/personas')}>
                        <Typography variant='button'>Volver a personas</Typography>
                    </Button>
                </Box>
            )}
        </Box>
    )
};

export default Detail;
