import Navbar from '../components/Navbar';

const Dashboard = () => {
  return (
    <div>
      <Navbar />
      <h1>DASHBOARD</h1>
      <div className="card">
        <h3>Welcome</h3>
        <p>Select a module from the navigation menu above.</p>
      </div>
    </div>
  );
};

export default Dashboard;
