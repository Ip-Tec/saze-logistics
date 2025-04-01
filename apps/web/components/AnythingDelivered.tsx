import Image from 'next/image';
import Restaurants from '@/public/images/chef.svg';
import Groceries from '@/public/images/groceries.svg';
import OnTheWay from '@/public/images/on-the-way.svg';

const AnythingDelivered = () => {
    return (
        <section className="w-full bg-gradient-to-br from-yellow-400 to-blue-500 text-gray-50 py-20 px-6">
            {/* Headline */}
            <div className="max-w-7xl mx-auto text-center mb-12">
                <h1 className="text-5xl font-extrabold mb-4">Anything delivered</h1>
            </div>

            {/* Feature Cards */}
            <div className="max-w-7xl mx-auto text-gray-50 grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Card 1 */}
                <div className="bg-gradient-to-br from-yellow-400 to-blue-500 hover:bg-gradient-to-bl cursor-pointer flex flex-col items-center text-center p-6 rounded-lg shadow-2xl">
                    <Image
                        src={Restaurants}
                        alt="Your city's top restaurants"
                        width={100}
                        height={100}
                    />
                    <h2 className="text-2xl font-semibold mt-4">Your city's top restaurants</h2>
                    <p className="text-gray-50 mt-2">
                        With a great variety of restaurants you can order your favourite food or explore new restaurants nearby!
                    </p>
                </div>

                {/* Card 2 */}
                <div className="bg-gradient-to-br from-blue-200 to-blue-500 hover:bg-gradient-to-bl cursor-pointer flex flex-col items-center text-center p-6 rounded-lg shadow-2xl">
                    <Image
                        src={OnTheWay}
                        alt="Fast delivery"
                        width={100}
                        height={100}
                    />
                    <h2 className="text-2xl font-semibold mt-4">Fast delivery</h2>
                    <p className="text-gray-50 mt-2">
                        Like a flash! Order or send anything in your city and receive it in minutes.
                    </p>
                </div>

                {/* Card 3 */}
                <div className="bg-gradient-to-br from-blue-500 to-blue-300 hover:bg-gradient-to-bl cursor-pointer flex flex-col items-center text-center p-6 rounded-lg shadow-2xl">
                    <Image
                        src={Groceries}
                        alt="Groceries delivery & more"
                        width={100}
                        height={100}
                    />
                    <h2 className="text-2xl font-semibold mt-4">Groceries delivery & more</h2>
                    <p className="text-gray-50 mt-2">
                        Find anything you need! From supermarkets to shops, pharmacies to florists — if it's in your city, order it and receive it.
                    </p>
                </div>
            </div>

            {/* CTA Button */}
            <div className="max-w-7xl mx-auto text-center mt-12 z-50">
                <button className="transition px-8 py-4 bg-gradient-to-br from-yellow-200 to-blue-500 text-white rounded-lg cursor-pointer hover:bg-gradient-to-bl font-semibold">
                    Explore stores around you
                </button>
            </div>
        </section>
    );
};

export default AnythingDelivered;
