#!/usr/bin/perl

my $newver;

sub procfile {
    my $filename = shift;
    open(FH, '<', $filename) or die $!;
    my $contents;
    while(<FH>) {
        if((!$newver) && /common.css\?([0-9]+)"/) {
            $newver = $1 + 1;
        }
        s/common.css\?([0-9]+)"/common.css?$newver"/g;
        s/common.js\?([0-9]+)"/common.js?$newver"/g;
        s/beelocal.js\?([0-9]+)"/beelocal.js?$newver"/g;
        $contents .= $_;
    }
    close(FH);
    open(FH, '>', $filename) or die $!;
    print FH $contents;
    close(FH);
}

procfile('count.html');
procfile('spellbee.html');
