import React, { Fragment, useState } from 'react';

import { TabContext, TabList, TabPanel } from '@mui/lab';
import { common } from '@mui/material/colors';
import { Box, Tab } from '@mui/material';

import Festividades from './Festividades';
import Actividades from './Actividades';

const Index = ({ people, viewOnly }) => {
    const [tabPosition, setTabPosition] = useState('1');

    return (
        <Fragment>
            <TabContext value={tabPosition}>
                <Box borderBottom={0.1} borderColor={'divider'} position={'sticky'} top={64} bgcolor={common['white']} zIndex={10} sx={{ borderTopLeftRadius: 4, borderTopRightRadius: 4 }}>
                    <TabList onChange={(e, v) => setTabPosition(v)} variant='scrollable'>
                        <Tab label='Actividades' value='1' />
                        <Tab label='Festividades Familiares' value='2' />
                    </TabList>
                </Box>
                <TabPanel value='1'>
                    <Actividades people={people} viewOnly={viewOnly} />
                </TabPanel>
                <TabPanel value='2'>
                    <Festividades people={people} viewOnly={viewOnly} />
                </TabPanel>
            </TabContext>
        </Fragment>
    )
}

export default Index