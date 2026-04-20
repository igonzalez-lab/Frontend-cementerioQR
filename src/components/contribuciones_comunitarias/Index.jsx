import React, { Fragment, useState } from 'react';

import { Box, Tab } from '@mui/material';
import { common } from '@mui/material/colors';
import { TabContext, TabList, TabPanel } from '@mui/lab';

import Contribuciones from './Contribuciones';
import ParticipacionSociedad from './ParticipacionSociedad';
import ParticipacionInstitucional from './ParticipacionInstitucional';

const Index = ({ people, viewOnly }) => {
    const [tabPosition, setTabPosition] = useState('1');

    return (
        <Fragment>
            <TabContext value={tabPosition}>
                <Box borderBottom={0.1} borderColor={'divider'} position={'sticky'} top={112.5} bgcolor={common['white']} zIndex={10} sx={{ borderTopLeftRadius: 4, borderTopRightRadius: 4 }}>
                    <TabList onChange={(e, v) => setTabPosition(v)} variant='scrollable'>
                        <Tab label='Contribuciones' value='1' />
                        <Tab label='Participacion Institucional' value='2' />
                        <Tab label='Participacion Sociedad en general' value='3' />
                    </TabList>
                </Box>
                <TabPanel value='1'>
                    <Contribuciones people={people} viewOnly={viewOnly} />
                </TabPanel>
                <TabPanel value='2'>
                    <ParticipacionInstitucional people={people} viewOnly={viewOnly} />
                </TabPanel>
                <TabPanel value='3'>
                    <ParticipacionSociedad people={people} viewOnly={viewOnly} />
                </TabPanel>
            </TabContext>
        </Fragment>
    )
};

export default Index;
