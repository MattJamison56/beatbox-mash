import Navbar from '../../components/navbar/navbar';

const HomePage: React.FC = () => {
  return (
    <div>
      <Navbar />
      <div style={{ padding: '20px' }}>
        <h1 style={{color: 'black' }}>Welcome to the Home Page</h1>
      </div>
    </div>
  );
};

export default HomePage;
