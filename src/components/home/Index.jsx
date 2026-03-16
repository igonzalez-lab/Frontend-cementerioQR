import React from 'react';
import { useSelector } from 'react-redux';
import { Link as LinkReactRouterDom, useNavigate } from 'react-router-dom';

import { blue } from '@mui/material/colors';
import { AdminPanelSettings, FormatListBulleted, Home, People } from '@mui/icons-material';
import { Box, Breadcrumbs, Typography, useMediaQuery, useTheme, Link as LinkMaterialUI, Card, CardActionArea, CardContent, Avatar } from '@mui/material';

import { jwtDecode } from 'jwt-decode';
import { decryptMessage } from '../../helpers/helpers';

const Index = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const token = useSelector((state) => state.user_cementerio_qr.data);
    const mobileScreen = useMediaQuery(theme.breakpoints.between('xs', 'sm'));

    return (
        <Box maxWidth={mobileScreen ? '87vw' : '100%'}>
            <Box display={'flex'} alignItems={'center'}>
                <Home fontSize='large' />
                <Typography variant='h4' ml={1}>Menú Principal</Typography>
            </Box>

            <Box role='presentation' onClick={(e) => e.preventDefault()} mb={2}>
                <Breadcrumbs maxItems={5}>
                    <LinkMaterialUI underline='hover' color='textPrimary' display={'flex'} alignItems={'center'} component={LinkReactRouterDom} to={'/'}>
                        <Home sx={{ mr: 0.5 }} fontSize='inherit' />
                        <Typography>Menú Principal</Typography>
                    </LinkMaterialUI>
                </Breadcrumbs>
            </Box>

            <Box mt={2} display={'flex'} alignItems={'center'} justifyContent={'space-around'} flexWrap={'wrap'}>
                <Card elevation={0} variant='outlined' sx={{ maxWidth: 345, mb: 2 }}>
                    <CardActionArea onClick={() => navigate('/personas')}>
                        <CardContent>
                            <Box display={'flex'} alignItems={'center'} mb={1}>
                                <Avatar sx={{ bgcolor: blue['100'], color: blue['600'] }}>
                                    <People />
                                </Avatar>
                                <Typography ml={1} variant='h5' component='div'>
                                    Personas
                                </Typography>
                            </Box>

                            <Typography color='textSecondary' textAlign='justify' variant='body2'>
                                Visualiza y administra a las personas registradas dentro de la plataforma
                            </Typography>
                        </CardContent>
                    </CardActionArea>
                </Card>

                {String(decryptMessage(jwtDecode(decryptMessage(token)).role)) !== '2' && (
                    <Card elevation={0} variant='outlined' sx={{ maxWidth: 345, mb: 2 }}>
                        <CardActionArea onClick={() => navigate('/cementerios')}>
                            <CardContent>
                                <Box display={'flex'} alignItems={'center'} mb={1}>
                                    <Avatar sx={{ bgcolor: blue['100'], color: blue['600'] }}>
                                        <FormatListBulleted />
                                    </Avatar>
                                    <Typography ml={1} variant='h5' component='div'>
                                        Cementerios
                                    </Typography>
                                </Box>

                                <Typography color='textSecondary' textAlign='justify' variant='body2'>
                                    Visualiza y administra el listado de cementerios judios actuales
                                </Typography>
                            </CardContent>
                        </CardActionArea>
                    </Card>
                )}

                {String(decryptMessage(jwtDecode(decryptMessage(token)).role)) === '5' && (
                    <Card elevation={0} variant='outlined' sx={{ maxWidth: 345, mb: 2 }}>
                        <CardActionArea onClick={() => navigate('/admin')}>
                            <CardContent>
                                <Box display={'flex'} alignItems={'center'} mb={1}>
                                    <Avatar sx={{ bgcolor: blue['100'], color: blue['600'] }}>
                                        <AdminPanelSettings />
                                    </Avatar>
                                    <Typography ml={1} variant='h5' component='div'>
                                        Administrar Usuarios
                                    </Typography>
                                </Box>

                                <Typography color='textSecondary' textAlign='justify' variant='body2'>
                                    Administra a los usuarios actuales dentro de la plataforma
                                </Typography>
                            </CardContent>
                        </CardActionArea>
                    </Card>
                )}
            </Box>
        </Box>
    )
};

export default Index;
