import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import userReducer from '../slices/userSlice';
import notificacionReducer from '../slices/notificationSlice';

const rootReducer = combineReducers({
    user_cementerio_qr: userReducer,
    notification_cementerio_qr: notificacionReducer,
});

const persistConfig = {
	key: 'root',
	storage,
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
	reducer: persistedReducer,
	devTools: true,
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware({
		serializableCheck: {
			ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
		},
	}),
});

export const persistor = persistStore(store);