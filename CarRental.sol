pragma solidity 0.6.0;
// SPDX-License-Identifier: UNLICENSED
import "DateTime.sol";

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
    address payable owner;

    constructor() public
    {
      owner = msg.sender;
    }
    mapping (bytes6 => Car) cars;
    uint numCars;
    struct Rental
    {
        bytes6 car;
        address owner;
        DateTime.Period rentalperiod;
        uint deposit;
    }
    function addCar(bytes6 lic, int kil, bytes32 br) public
    {
        bytes6 notExisting;
        Car memory newCar;
        newCar.license = lic;
        newCar.kilometers = kil;
        newCar.brand = br;
        newCar.owner = msg.sender;
        if (cars[lic].license != notExisting)
          revert("Car already registered");
        cars[lic] = newCar;
        numCars++;
    }
    function getNumCars() public view returns (uint)
    {
        return numCars;
    }
    event RentalAccepted(bytes6 license, uint8 numRentals, uint16 numDays);
    function rentCar(bytes6 car, uint16 syear, uint8 smonth, uint8 sday, uint16 eyear, uint8 emonth, uint8 eday) public payable
    {
        if (DateTime.isDayBefore(eyear,emonth,eday,syear,smonth,sday))
            revert("Invalid period");
        bytes6 notExisting;
        Car storage myCar = cars[car];
        if (myCar.license == notExisting)
          revert("This car does not exist in the system.");
        mapping(uint8 => Rental) storage myRentals = myCar.rentals;
        for (uint8 i = 0; i < myCar.numRentals; i++)
        {
             if (!DateTime.isDayBefore(myRentals[i].rentalperiod.end.year,myRentals[i].rentalperiod.end.month,myRentals[i].rentalperiod.end.day,syear,smonth,sday))
                if (!DateTime.isDayBefore(eyear,emonth,eday,myRentals[i].rentalperiod.start.year,myRentals[i].rentalperiod.start.month,myRentals[i].rentalperiod.start.day))
                    revert("Car has already reservation for this period");

        }
        DateTime.Day memory stday = DateTime.Day(syear,smonth,sday);
        DateTime.Day memory endday = DateTime.Day(eyear,emonth,eday);
        DateTime.Period memory per = DateTime.Period(stday,endday);
        Rental memory rent = Rental(car,msg.sender,per,msg.value);
        myCar.rentals[myCar.numRentals++] = rent;
        uint16 numDays = DateTime.diffDays(syear,smonth,sday,eyear,emonth,eday);
        emit RentalAccepted(myCar.license,myCar.numRentals, numDays);
    }
    function destructContract() public
    {
      require(msg.sender == owner);
      selfdestruct(owner);
    }
}
