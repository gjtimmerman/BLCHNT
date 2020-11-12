pragma solidity ^0.6.0;

contract CarRental
{
    struct Car
    {
        bytes6 license;
        address owner;
        int kilometers;
        bytes32 brand;
        mapping(uint8 => Rental) rentals;
        uint8 numRentals;
    }
    struct Day
    {
        uint16 year;
        uint8 month;
        uint8 day;
    }
    struct Period
    {
        Day start;
        Day end;
    }
    function isDayBefore(Day memory d1, Day memory d2) private pure returns (bool)
    {
        if (d1.year < d2.year)
            return true;
            else if (d1.year > d2.year)
            return false;
            else if (d1.month < d2.month)
            return true;
            else if (d1.month > d2.month)
            return false;
            else if (d1.day < d2.day)
            return true;
            else if (d1.day >= d2.day)
            return false;
    }
    function periodIntersect(Period memory first, Period memory second) private pure returns (bool res)
    {
        if (isDayBefore(first.end,second.start))
            return false;
            else
            if (isDayBefore(second.end,first.start))
            return false;
            else
            return true;

    }
    mapping (bytes6 => Car) cars;
    struct Rental
    {
        bytes6 car;
        address owner;
        Period rentalperiod;
        uint deposit;
    }
    function addCar(bytes6 lic, int kil, bytes32 br) public
    {
        Car memory newCar;
        newCar.license = lic;
        newCar.kilometers = kil;
        newCar.brand = br;
        newCar.owner = msg.sender;
        cars[lic] = newCar;
    }
    function rentCar(bytes6 car, uint16 syear, uint8 smonth, uint8 sday, uint16 eyear, uint8 emonth, uint8 eday) public payable
    {

        Day memory stday = Day(syear,smonth,sday);
        Day memory endday = Day(eyear,emonth,eday);
        Period memory per = Period(stday,endday);
        Car storage myCar = cars[car];
        mapping(uint8 => Rental) storage myRentals = myCar.rentals;
        for (uint8 i = 0; i < myCar.numRentals; i++)
        {
             if (periodIntersect(myRentals[i].rentalperiod,per))
                 revert();
        }
        Rental memory rent = Rental(car,msg.sender,per,msg.value);
        myCar.rentals[myCar.numRentals++] = rent;
    }
}