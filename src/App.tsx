import { BrowserRouter as Router, useRoutes } from 'react-router-dom';
import { Provider } from 'react-redux';
import store from './redux/store';
import routes from './routes/Routes';
function AppRoutes() {
    const element = useRoutes(routes);
    return element;
}
function App() {
    return (
        <Provider store={store}>
                <Router>
                    <AppRoutes />
                </Router>
        </Provider>
    );
}
export default App;
