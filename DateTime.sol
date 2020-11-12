pragma solidity ^0.6.0;

library DateTime
{
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

function diffDays (uint16 y1, uint8 m1, uint8 day1, uint16 y2, uint8 m2, uint8 day2) public pure returns (uint16)
{
    uint8 [12] memory numDays = [31,28,31,30,31,30,31,31,30,31,30,31];
    Day memory d1 = Day(y1,m1,day1);
    Day memory d2 = Day(y2,m2,day2);
    uint16 diffyears = d2.year - d1.year;
    if (diffyears > 1 || (diffyears == 1 && d1.month < d2.month) || (diffyears == 1 && d1.month == d2.month && d1.day < d2.day))
      revert("Rental period of more than one year is not possible!");
    uint8 diffmonths;
    if (d2.month < d1.month)
    {
      diffyears -= 1;
      diffmonths = 12 + d2.month - d1.month;
    }
    else
      diffmonths = d2.month - d1.month;
    uint16 diffdays;
    uint8 minusMonth = 0;
    if (d2.day < d1.day)
    {
      diffmonths -= 1;
      minusMonth = 1;
      diffdays = numDays[d1.month-1] + d2.day - d1.day + 1;
    }
    else
      diffdays = d2.day - d1.day + 1;
    if (d1.year == d2.year && d1.year % 4 == 0 && d1.month <= 2 && d2.month > 2)
        diffdays += 1;
    else
        if (d1.year < d2.year && d1.year % 4 == 0 && d1.month <= 2)
          diffdays += 1;
        else if (d1.year < d2.year && d2.year % 4 == 0 && d2.month > 2)
          diffdays += 1;
    if (diffmonths == 0)
          return diffdays;
    else
    {
      if (d1.month + minusMonth < d2.month)
            for( uint8 i = d1.month + minusMonth-1; i < d2.month-1; i++)
              diffdays += numDays[i];
      else
      {
            for (uint8 i = d1.month + minusMonth - 1; i < 12; i++)
              diffdays += numDays[i];
            for (uint8 i = 0; i < d2.month-1; i++)
              diffdays += numDays[i];
      }
      return diffdays;
    }
}
function isSameDay(uint16 y1, uint8 m1, uint8 d1, uint16 y2, uint8 m2, uint8 d2) public pure returns (bool)
{
  return d1 == d2 && m1 == m2 && y1 == y2;
}
function isDayBefore(uint16 y1, uint8 m1, uint8 day1, uint16 y2, uint8 m2, uint8 day2) public pure returns (bool)
{
    Day memory d1 = Day(y1,m1,day1);
    Day memory d2 = Day(y2,m2,day2);
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
function periodIntersect(uint16 y1, uint8 m1, uint8 d1, uint16 y2, uint8 m2, uint8 d2,uint16 y3, uint8 m3, uint8 d3, uint16 y4, uint8 m4, uint8 d4) public pure returns (bool res)
{
      Day memory day1 = Day(y1,m1,d1);
      Day memory day2 = Day(y2,m2,d2);
      Day memory day3 = Day(y3,m3,d3);
      Day memory day4 = Day(y4,m4,d4);
      Period memory first = Period(day1,day2);
      Period memory second = Period(day3,day4);
    if (isDayBefore(first.end.year,first.end.month,first.end.day,second.start.year,second.start.month,second.start.day))
        return false;
        else
        if (isDayBefore(second.end.year,second.end.month,second.end.day,first.start.year,first.start.month,first.start.day))
        return false;
        else
        return true;

}
}
